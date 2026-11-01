// Reads a job post (or a LinkedIn profile, for recruiter outreach) and opens the new issue form.
// The supported sites: docs/supported-sites.md.
(() => {
  const REPO = 'USER/job-applications';
  const host = location.hostname.replace(/^www\./, '');
  const path = location.pathname.split('/').filter(Boolean);
  const cap = s => s.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  let position = document.title.replace(/^\(\d+\)\s*/, '').trim();
  let company = '';
  let link = location.href;
  let recruiter = '';
  const q = s => { const e = document.querySelector(s); return e ? e.innerText.trim() : ''; };
  // Job boards: how to read the position and the company on each site (the key is the host
  // without www; its subdomains count too). A job board must be in jobBoards in config.yaml too,
  // so Source becomes Job board; an ATS (the job pages of many companies, like Jobylon) is not.
  // An empty value comes from the JobPosting of the page. The list of supported sites is
  // docs/supported-sites.md. To add a site, follow skills/add-job-board/SKILL.md.
  const JOB_BOARDS = {
    // Title: "The Hub | Position | Company"
    'thehub.io': () => {
      const t = document.title.split(' | ');
      return { position: t[1] || '', company: t.slice(2).join(' | ') };
    },
    // Platsbanken (Arbetsförmedlingen), /platsbanken/annonser/ID: the h1 is the position, the h2
    // the employer. Before the page has them: the title "Position - Company - Platsbanken"
    'arbetsformedlingen.se': () => {
      const t = / - Platsbanken$/.test(document.title) ? document.title.replace(/ - Platsbanken$/, '').split(' - ') : [];
      return {
        position: q('h1.break-title') || (t.length > 1 ? t[0] : ''),
        company: q('h2.break-title') || t.slice(1).join(' - '),
      };
    },
    // Indeed (se.indeed.com and the other countries): viewjob?jk=ID, or a search with the job
    // open in the side panel (vjk=ID)
    'indeed.com': () => {
      const s = new URLSearchParams(location.search);
      const jk = s.get('jk') || s.get('vjk');
      return {
        position: q('[data-testid="jobsearch-JobInfoHeader-title"], h1.jobsearch-JobInfoHeader-title').replace(/\s*-\s*job post$/i, ''),
        company: q('[data-testid="inlineHeader-companyName"], [data-company-name]'),
        link: jk ? location.origin + '/viewjob?jk=' + jk : '',
      };
    },
    // Jobylon (an ATS). Title: "Position - Company | Jobylon"
    'jobylon.com': () => {
      const t = document.title.replace(/\s*\|\s*Jobylon$/, '');
      const i = t.lastIndexOf(' - ');
      return { position: i > 0 ? t.slice(0, i) : t, company: i > 0 ? t.slice(i + 3) : '' };
    },
  };
  const board = Object.keys(JOB_BOARDS).find(b => host === b || host.endsWith('.' + b));
  // The description element of known sites, when the page has no JSON-LD (the place to fix
  // when a site changes): LinkedIn, Greenhouse, Lever, Workday, Indeed, Platsbanken
  const DESCRIPTION = [
    '.jobs-description__content', '#job-details', '.jobs-box__html-content',
    '.job__description', '#content .body', '[data-qa="job-description"]', '.posting-page .section-wrapper',
    '[data-automation-id="jobPostingDescription"]', '#jobDescriptionText', '.job-description',
  ];
  // The schema.org JobPosting of the page (most job sites and ATSs have one)
  const ld = (() => {
    const all = [...document.querySelectorAll('script[type="application/ld+json"]')].flatMap(s => {
      try { const j = JSON.parse(s.textContent); return [].concat(j['@graph'] || j); } catch (e) { return []; }
    });
    return all.find(j => j && [].concat(j['@type']).includes('JobPosting')) || null;
  })();
  // Text with line breaks from HTML (DOMParser: nothing in it runs or loads)
  const toText = html => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    doc.querySelectorAll('li').forEach(e => e.prepend('- '));
    doc.querySelectorAll('br, li, div').forEach(e => e.append('\n'));
    doc.querySelectorAll('p, h1, h2, h3, h4, ul, ol').forEach(e => e.append('\n\n'));
    return doc.body.textContent;
  };
  // Stage and Source are dropdowns: a URL cannot set them. The sync workflow fills them in
  // (Applied; the Source from the link: LinkedIn job post, Job board, Company website, or Recruiter outreach).

  if (host.endsWith('linkedin.com') && path[0] === 'in') {
    // A profile: the recruiter who wrote to you (no link: Source is Recruiter outreach)
    recruiter = position.split(' | ')[0] + ' ' + link.split('?')[0];
    position = '';
    link = '';
  } else if (host.endsWith('linkedin.com')) {
    const t = position.split(' | ');
    position = t[0] || '';
    company = t.length > 2 ? t[1] : '';
    const m = link.match(/currentJobId=(\d+)/) || link.match(/jobs\/view\/(\d+)/);
    if (m) link = 'https://www.linkedin.com/jobs/view/' + m[1] + '/';
  } else if (board) {
    const r = JOB_BOARDS[board]();
    position = r.position || (ld && ld.title) || position.split(/\s[|–—-]\s/)[0];
    company = r.company || (ld && ld.hiringOrganization && ld.hiringOrganization.name) || '';
    link = r.link || location.origin + location.pathname;
  } else {
    if (/greenhouse\.io|lever\.co|ashbyhq\.com|workable\.com|smartrecruiters\.com/.test(host)) {
      company = cap(path[0] || '');
    } else if (/teamtailor\.com|myworkdayjobs\.com|bamboohr\.com|recruitee\.com|personio\.(de|com)|breezy\.hr|homerun\.co|workbuster\.(se|com)/.test(host)) {
      company = cap(host.split('.')[0]);
    } else {
      const parts = host.split('.').filter(p => !/^(jobs|careers|career|work|join)$/.test(p));
      company = cap(parts[parts.length - 2] || parts[0] || '');
    }
    position = position.split(/\s[|–—@-]\s/)[0];
    // The JobPosting knows better than the host and the page title
    if (ld && ld.hiringOrganization && ld.hiringOrganization.name) company = ld.hiringOrganization.name;
    if (ld && ld.title) position = ld.title;
  }

  // Job description: the text you selected, the JobPosting, a known element, or the longest
  // text block of the page (no description on a LinkedIn profile)
  let description = String(getSelection()).trim();
  if (!description && ld && ld.description) description = toText(ld.description);
  if (!description) {
    const el = DESCRIPTION.map(s => document.querySelector(s)).find(e => e && e.innerText.trim());
    if (el) description = el.innerText;
  }
  if (!description && recruiter === '') {
    const blocks = [...document.querySelectorAll('main, article, section, [role="main"]')];
    const best = blocks.sort((a, b) => b.innerText.length - a.innerText.length)[0];
    if (best && best.innerText.length > 500) description = best.innerText;
  }
  description = description.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();

  // Github puts these values back when you change them in the form: edit the issue after you create it
  const params = text => new URLSearchParams({
    template: 'application.yaml',
    title: '[' + company + '] ' + position,
    company, position, recruiter, link,
    date: new Date().toISOString().slice(0, 10),
    description: text,
  });
  // A very long URL does not open: cut the description, and copy all of it to the clipboard
  const MAX_URL = 7000;
  let text = description;
  while (text && params(text).toString().length > MAX_URL) text = text.slice(0, Math.floor(text.length * 0.8));
  const cut = text !== description;
  if (cut) {
    text = text + '\n\n[…] Cut: paste the full text from the clipboard after you create the issue.';
    navigator.clipboard.writeText(description).catch(() => {});
  }
  window.open('https://github.com/' + REPO + '/issues/new?' + params(text), '_blank');
  if (cut) alert('The job description is long. The form has the start of it; the full text is on the clipboard: paste it into the issue after you create it.');
})();
