// Buffer (GraphQL) client. The key lives only in the BUFFER_API_KEY environment variable.
const URL_ = 'https://api.buffer.com';

export const bufferReady = () => Boolean(process.env.BUFFER_API_KEY);

async function gql(query, variables = {}) {
  if (!bufferReady()) throw new Error('Buffer is not connected yet (BUFFER_API_KEY is missing).');
  const r = await fetch(URL_, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${process.env.BUFFER_API_KEY}` },
    body: JSON.stringify({ query, variables }),
  });
  let j = null;
  try { j = await r.json(); } catch { /* not json */ }
  if (!r.ok) throw new Error(`Buffer said no (${r.status}).` + (j?.errors?.[0]?.message ? ' ' + j.errors[0].message : ''));
  if (j?.errors?.length) throw new Error(j.errors[0].message || 'Buffer error.');
  return j?.data || {};
}

export async function listChannels() {
  const d = await gql(`query { account { organizations { id channels { id name service } } } }`);
  const out = [];
  for (const o of d.account?.organizations || []) for (const c of o.channels || []) out.push({ id: c.id, name: c.name, service: c.service, organization: o.id });
  return out;
}

// Create one post on one channel. when = ISO date string or null (null -> next queue slot).
export async function createPost({ channelId, text, imageUrl, when }) {
  const d = await gql(`mutation Create($input: CreatePostInput!) {
    createPost(input: $input) {
      ... on PostActionSuccess { post { id } }
      ... on MutationError { message }
    } }`, {
    input: {
      channelId, text,
      schedulingType: 'automatic',
      mode: when ? 'customScheduled' : 'addToQueue',
      ...(when ? { dueAt: new Date(when).toISOString() } : {}),
      ...(imageUrl ? { assets: { images: [{ url: imageUrl }] } } : {}),
    },
  });
  const res = d.createPost;
  if (res?.message) throw new Error(res.message);
  if (!res?.post?.id) throw new Error('Buffer did not confirm the post.');
  return res.post.id;
}
