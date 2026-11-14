// Every module of the admin panel is described here. The admin API and the admin screens are both driven by
// this list, so adding a field or a whole new module means editing this file only.
// Field types: text, textarea, email, tel, number, money, date, select (options), checkbox, ref (another entity), url.

const f = (key, label, type = 'text', extra = {}) => ({ key, label, type, ...extra });

// Hire tracker, in Maldives order.
export const TRACKER = [
  ['quota_approved', 'Quota approved'],
  ['permit_issued', 'Work permit issued'],
  ['arrived', 'Worker arrived'],
  ['medical_cleared', 'Medical cleared (within 15 days)'],
  ['visa_issued', 'Work visa issued'],
];

export const GROUPS = ['Operations', 'Finance', 'Content', 'Config', 'Admin'];

export const ENTITIES = {
  inquiries: {
    label: 'Inquiries', group: 'Operations', title: ['name', 'company'], statuses: ['new', 'contacted', 'quoted', 'won', 'lost', 'archived'],
    list: ['name', 'company', 'phone', 'service', 'created_at'], search: ['name', 'company', 'email', 'phone', 'message'],
    fields: [f('name', 'Name', 'text', { required: true }), f('company', 'Company'), f('email', 'Email', 'email'), f('phone', 'Phone', 'tel'),
      f('service', 'Service'), f('source', 'How they found us'), f('worker', 'Worker asked about'), f('count', 'Number of workers', 'number'),
      f('message', 'Message', 'textarea'), f('notes', 'Our notes', 'textarea'), f('old_id', 'Old website ID')],
  },
  quota: {
    label: 'Quota applications', group: 'Operations', title: ['company', 'ref'], statuses: ['new', 'documents requested', 'submitted', 'approved', 'rejected', 'closed'],
    list: ['ref', 'company', 'qtype', 'phone', 'created_at'], search: ['ref', 'company', 'regno', 'contact', 'phone', 'email', 'roles'],
    fields: [f('ref', 'Reference'), f('company', 'Company', 'text', { required: true }), f('regno', 'Registration number'), f('qtype', 'Quota type'), f('qother', 'Other type'),
      f('island', 'Island / site'), f('contact', 'Contact person'), f('position', 'Position'), f('phone', 'Phone', 'tel'), f('email', 'Email', 'email'),
      f('workers', 'Number of workers'), f('roles', 'Roles needed', 'textarea'), f('nationality', 'Preferred nationality'), f('service', 'Service'),
      f('message', 'Notes from applicant', 'textarea'), f('files', 'Files they said they sent', 'number'), f('notes', 'Our notes', 'textarea')],
  },
  workers: {
    label: 'Workers', group: 'Operations', title: ['name'], statuses: ['available', 'reserved', 'placed', 'inactive'],
    list: ['name', 'role', 'country', 'phone', 'status'], search: ['name', 'role', 'country', 'phone', 'passport'],
    fields: [f('name', 'Full name', 'text', { required: true }), f('role', 'Role / trade'), f('sector', 'Sector'), f('country', 'Country'),
      f('dob', 'Date of birth', 'date'), f('gender', 'Gender', 'select', { options: ['Male', 'Female'] }), f('phone', 'Phone', 'tel'),
      f('email', 'Email', 'email'), f('passport', 'Passport number'), f('experience', 'Experience (years)', 'number'),
      f('languages', 'Languages'), f('skills', 'Skills', 'textarea'), f('show_public', 'Show on public workers page', 'checkbox'),
      f('notes', 'Notes', 'textarea')],
  },
  applications: {
    label: 'Worker applications', group: 'Operations', title: ['name'], statuses: ['new', 'screening', 'shortlisted', 'rejected', 'hired'],
    list: ['name', 'role', 'country', 'phone', 'created_at'], search: ['name', 'role', 'country', 'phone', 'email'],
    fields: [f('name', 'Name', 'text', { required: true }), f('dob', 'Date of birth', 'date'), f('gender', 'Gender'), f('country', 'Country'),
      f('phone', 'Phone', 'tel'), f('email', 'Email', 'email'), f('location', 'Current location'), f('sector', 'Sector'), f('role', 'Role'),
      f('experience', 'Experience'), f('languages', 'Languages'), f('passport', 'Passport'), f('available', 'Available from'),
      f('skills', 'Skills', 'textarea'), f('job', 'Applied for job'), f('notes', 'Our notes', 'textarea')],
  },
  jobs: {
    label: 'Jobs', group: 'Operations', title: ['title'], statuses: ['open', 'filled', 'closed'],
    list: ['title', 'employer', 'location', 'status'], search: ['title', 'employer', 'location'],
    fields: [f('title', 'Job title', 'text', { required: true }), f('employer', 'Employer'), f('sector', 'Sector'), f('location', 'Location'),
      f('salary', 'Salary'), f('positions', 'Positions', 'number'), f('description', 'Description', 'textarea'), f('show_public', 'Show on website', 'checkbox')],
  },
  clients: {
    label: 'Clients', group: 'Operations', title: ['name'], statuses: ['active', 'inactive'],
    list: ['name', 'type', 'contact', 'phone'], search: ['name', 'contact', 'email', 'phone', 'reg_no'],
    fields: [f('name', 'Client / company name', 'text', { required: true }), f('type', 'Type', 'select', { options: ['Household', 'Company'] }),
      f('contact', 'Contact person'), f('phone', 'Phone', 'tel'), f('email', 'Email', 'email'), f('reg_no', 'Registration / ID number'),
      f('address', 'Address', 'textarea'), f('notes', 'Notes', 'textarea')],
  },
  placements: {
    label: 'Hiring tracker', group: 'Operations', title: ['worker_name', 'client_name'], statuses: ['in progress', 'completed', 'cancelled'],
    list: ['worker_name', 'client_name', 'progress', 'status'], search: ['worker_name', 'client_name'], tracker: true,
    fields: [f('client_id', 'Client', 'ref', { ref: 'clients' }), f('client_name', 'Client name'), f('worker_id', 'Worker', 'ref', { ref: 'workers' }),
      f('worker_name', 'Worker name'), f('role', 'Role'), ...TRACKER.map(([k, l]) => f(k, l, 'date')), f('notes', 'Notes', 'textarea')],
  },
  schedules: {
    label: 'Schedules', group: 'Operations', title: ['worker_name', 'date'], statuses: ['planned', 'done', 'cancelled'],
    list: ['date', 'worker_name', 'client_name', 'start', 'end'], search: ['worker_name', 'client_name'],
    fields: [f('worker_id', 'Worker', 'ref', { ref: 'workers' }), f('worker_name', 'Worker name'), f('client_id', 'Client', 'ref', { ref: 'clients' }),
      f('client_name', 'Client name'), f('date', 'Date', 'date', { required: true }), f('start', 'Start time'), f('end', 'End time'), f('notes', 'Notes', 'textarea')],
  },
  attendance: {
    label: 'Attendance', group: 'Operations', title: ['worker_name', 'date'], statuses: ['present', 'absent', 'late', 'leave'],
    list: ['date', 'worker_name', 'status', 'hours'], search: ['worker_name'],
    fields: [f('worker_id', 'Worker', 'ref', { ref: 'workers' }), f('worker_name', 'Worker name'), f('date', 'Date', 'date', { required: true }),
      f('hours', 'Hours worked', 'number'), f('notes', 'Notes', 'textarea')],
  },
  invoices: {
    label: 'Invoices', group: 'Finance', title: ['number', 'client_name'], statuses: ['draft', 'sent', 'paid', 'overdue', 'void'], numbered: 'INV',
    list: ['number', 'client_name', 'total', 'due_date', 'status'], search: ['number', 'client_name'], money: ['total'],
    fields: [f('client_id', 'Client', 'ref', { ref: 'clients' }), f('client_name', 'Client name', 'text', { required: true }), f('description', 'Description', 'textarea'),
      f('issue_date', 'Issue date', 'date'), f('due_date', 'Due date', 'date'), f('amount', 'Amount (MVR)', 'money', { required: true }),
      f('tax', 'Tax (MVR)', 'money'), f('total', 'Total (MVR)', 'money', { computed: true }), f('paid_on', 'Paid on', 'date')],
    compute: (d) => ({ ...d, total: round2(num(d.amount) + num(d.tax)) }),
  },
  payroll: {
    label: 'Payroll', group: 'Finance', title: ['worker_name', 'month'], statuses: ['draft', 'approved', 'paid'],
    list: ['month', 'worker_name', 'net', 'status'], search: ['worker_name', 'month'], money: ['net'],
    fields: [f('worker_id', 'Worker', 'ref', { ref: 'workers' }), f('worker_name', 'Worker name', 'text', { required: true }), f('month', 'Month (YYYY-MM)', 'text', { required: true }),
      f('base', 'Base pay (MVR)', 'money'), f('bonus', 'Bonus (MVR)', 'money'), f('deductions', 'Deductions (MVR)', 'money'), f('net', 'Net pay (MVR)', 'money', { computed: true }),
      f('notes', 'Notes', 'textarea')],
    compute: (d) => ({ ...d, net: round2(num(d.base) + num(d.bonus) - num(d.deductions)) }),
  },
  expenses: {
    label: 'Expenses', group: 'Finance', title: ['description'], statuses: ['recorded', 'approved'],
    list: ['date', 'category', 'description', 'amount'], search: ['description', 'category'], money: ['amount'],
    fields: [f('date', 'Date', 'date', { required: true }), f('category', 'Category'), f('description', 'Description', 'text', { required: true }),
      f('amount', 'Amount (MVR)', 'money', { required: true }), f('notes', 'Notes', 'textarea')],
  },
  feedback: {
    label: 'Feedback', group: 'Content', title: ['name'], statuses: ['new', 'approved', 'hidden'],
    list: ['name', 'rating', 'created_at', 'status'], search: ['name', 'message'],
    fields: [f('name', 'Name', 'text', { required: true }), f('rating', 'Rating (1-5)', 'number'), f('message', 'Message', 'textarea')],
  },
  testimonials: {
    label: 'Testimonials', group: 'Content', title: ['name'], statuses: ['published', 'hidden'],
    list: ['name', 'role', 'status'], search: ['name', 'quote'],
    fields: [f('name', 'Name', 'text', { required: true }), f('role', 'Role / company'), f('quote', 'Quote', 'textarea', { required: true })],
  },
  services: {
    label: 'Services & prices', group: 'Content', title: ['name'], statuses: ['published', 'hidden'],
    list: ['name', 'price', 'status'], search: ['name', 'summary'],
    fields: [f('name', 'Service name', 'text', { required: true }), f('summary', 'Summary', 'textarea'), f('price', 'Price / fee'), f('order', 'Sort order', 'number')],
  },
  posts: {
    label: 'Blog posts', group: 'Content', title: ['title'], statuses: ['draft', 'published'],
    list: ['title', 'author', 'status', 'created_at'], search: ['title', 'body'],
    fields: [f('title', 'Title', 'text', { required: true }), f('slug', 'Web address (slug)'), f('author', 'Author'), f('summary', 'Summary', 'textarea'), f('body', 'Article', 'textarea')],
  },
  social: {
    label: 'Social posts', group: 'Content', title: ['text'], statuses: ['draft', 'scheduled', 'posted', 'failed'],
    list: ['text', 'channels', 'schedule_at', 'status'], search: ['text'],
    fields: [f('text', 'Post text', 'textarea', { required: true }), f('image_url', 'Image link', 'url'),
      f('channels', 'Channels', 'text'), f('schedule_at', 'Schedule for (date and time)', 'text')],
  },
  documents: {
    label: 'Documents', group: 'Operations', title: ['name'], statuses: ['active', 'expired'],
    list: ['name', 'owner', 'type', 'expires'], search: ['name', 'owner', 'type'],
    fields: [f('name', 'Document name', 'text', { required: true }), f('type', 'Type'), f('worker_id', 'Worker (shows in their portal)', 'ref', { ref: 'workers' }), f('owner', 'Belongs to (name)'),
      f('link', 'File link', 'url'), f('expires', 'Expiry date', 'date'), f('notes', 'Notes', 'textarea')],
  },
};

export const num = (v) => Number(v) || 0;
export const round2 = (v) => Math.round(v * 100) / 100;

// Permissions are "<entity>.view" and "<entity>.manage" plus a few global ones.
export const allPermissions = () => [
  ...Object.keys(ENTITIES).flatMap((e) => [`${e}.view`, `${e}.manage`]),
  'users.manage', 'settings.manage', 'audit.view', 'deleted.manage', 'reports.view',
];

const all = (e) => [`${e}.view`, `${e}.manage`];
export const DEFAULT_ROLES = {
  admin: { label: 'Administrator', permissions: ['*'] },
  operations: { label: 'Operations manager', permissions: ['inquiries', 'workers', 'applications', 'jobs', 'clients', 'placements', 'schedules', 'attendance', 'documents'].flatMap(all).concat(['reports.view']) },
  recruiter: { label: 'Recruiter', permissions: ['workers', 'applications', 'jobs', 'documents'].flatMap(all) },
  accountant: { label: 'Accountant', permissions: ['invoices', 'payroll', 'expenses'].flatMap(all).concat(['clients.view', 'workers.view', 'reports.view']) },
  front_desk: { label: 'Front desk', permissions: ['inquiries', 'clients'].flatMap(all).concat(['workers.view', 'jobs.view']) },
  client: { label: 'Client (portal only)', permissions: ['portal.client'] },
  staff: { label: 'Staff member (portal only)', permissions: ['portal.staff'] },
  marketing: { label: 'Marketing', permissions: ['posts', 'social', 'testimonials', 'services', 'feedback'].flatMap(all) },
};

export const trackerProgress = (d) => `${TRACKER.filter(([k]) => d[k]).length}/${TRACKER.length}`;
