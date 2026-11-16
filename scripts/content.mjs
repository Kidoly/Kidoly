/** What the README cards show. Edit this, then run `npm run build`. */

// (file stem, number, title, description)
export const BANDS = [
  ['band-stack', '01', 'Stack', 'What I run at work and in the homelab, by area.'],
  ['band-projects', '02', 'Projects', 'Things I built and keep running.'],
  ['band-activity', '03', 'Activity', 'Contributions on GitHub, refreshed every 5 minutes.'],
];

// Stack rows: (file stem, area, [[label, simple-icons slug or null], ...])
export const STACK = [
  [
    'stack-virtualisation',
    'Virtualisation & storage',
    [
      ['Proxmox VE', 'proxmox'], ['Ceph', 'ceph'], ['VMware vSphere', null], ['Veeam', null],
      ['Kubernetes', 'kubernetes'], ['Docker', 'docker'],
    ],
  ],
  [
    'stack-network',
    'Network & security',
    [
      ['FortiGate', 'fortinet'], ['Arista · BGP, VXLAN', null], ['OPNsense', 'opnsense'], ['HAProxy', 'haproxy'],
      ['HashiCorp Vault', 'vault'], ['Authentik SSO', 'authentik'],
    ],
  ],
  [
    'stack-systems',
    'Systems',
    [['Debian', 'debian'], ['Windows Server', null], ['Active Directory', null], ['Exchange 2019', null]],
  ],
  [
    'stack-automation',
    'Automation & monitoring',
    [
      ['Ansible', 'ansible'], ['Terraform / OpenTofu', 'terraform'], ['GitLab CI', 'gitlab'], ['PowerShell', null],
      ['Python', 'python'], ['Bash', 'gnubash'], ['Zabbix / PRTG', null],
    ],
  ],
  [
    'stack-development',
    'Development',
    [['Rust', 'rust'], ['Next.js', 'nextdotjs'], ['Flutter', 'flutter'], ['Symfony', 'symfony']],
  ],
];

// Contact buttons: (file stem, label, simple-icons slug or null, accent fill?)
export const BUTTONS = [
  ['btn-site', 'albanmary.com', null, true],
  ['btn-linkedin', 'LinkedIn', null, false],
  ['btn-mail', 'Email', 'gmail', false],
  ['btn-rss', 'Blog RSS', 'rss', false],
];
