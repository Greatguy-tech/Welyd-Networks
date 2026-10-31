# Welyd Networks website

A responsive static agency website built with plain HTML, CSS, and vanilla JavaScript. It includes an overview page and dedicated pages for branding and graphic design, digital marketing, website design, and a project-progress dashboard prototype. No build step or package install is required.

The Nairobi Events page contains 15 illustrative event formats for networking, exhibiting, learning, partnerships, and community engagement. These are sample use cases, not a live or verified event calendar; confirm event schedules and venues with organizers.

Visitors can switch between the default and dark themes using the floating theme button. The preference is saved in the browser for future visits.

The Project Progress page demonstrates milestone tracking using illustrative sample projects. It is a front-end prototype only: it has no authentication, private client data, persistence, or live project updates. A secure client portal requires an authenticated backend and project-data storage before it can be used for real client collaboration.

## Run locally

1. Open this folder in Visual Studio Code.
2. Open `index.html` directly in a browser, or use the Live Server extension and choose **Open with Live Server**.

The site uses external Google Fonts and photography from Unsplash and Magnific, so those assets need an internet connection; the provided logo and favicon are local files.

## Edit the site

- Replace the sample copy and contact details in the HTML pages.
- The `project-progress.html` page demonstrates a sample project dashboard; milestone examples and progress figures are illustrative and are not connected to actual client projects.
- Update the individual service pages (`branding-design.html`, `digital-marketing.html`, and `website-design.html`) as your offering and deliverables evolve. The service dropdown is shared across the site navigation.
- The homepage highlights selected client projects; `news.html` lists the provided 11 client projects by service and industry. The project summaries do not claim unprovided results or display client artwork. Generic Magnific stock photos are used as representative industry imagery, not client deliverables; visible captions credit and link to each contributor and photo listing.
- Use the web-sized image derivatives in `images/optimized/` in page layouts; the original supplied image files remain in `images/`.
- The site header and social previews use `images/welyd-wordmark.png`; the footer uses the transparent `images/welyd-wordmark-dark.png` in both themes. The favicon uses the square `images/welyd-icon.png` crop. Dark theme switches the header to the white-wordmark variant.
- Replace the Unsplash image URLs with your own optimized images and descriptive alt text.
- Update sample team members and testimonials on `about.html` and `index.html`.
- Edit the case-study and article sample content in the `articles` object in `js/main.js`.
- Update service prices in `index.html`, `services.html`, and the matching detail page (`branding-design.html`, `website-design.html`, or `digital-marketing.html`) so pricing stays consistent.
- Update social URLs, phone, email, address, working hours, and WhatsApp URL in each page footer and in the contact sections. These are sample placeholders, not verified business contact details.

## Connect inquiry submissions

The inquiry form validates required fields and consent in the browser, includes a honeypot, shows a loading state, and reports success or errors. It will **not send** until connected to a form provider.

1. Create a form with [Formspree](https://formspree.io/) and copy its endpoint, for example `https://formspree.io/f/your-form-id`.
2. Replace `FORM_ENDPOINT` at the top of `js/main.js` with that endpoint.
3. Submit a test enquiry and confirm it arrives in your provider account.

The newsletter form currently validates the email and displays an activation note; connect it to your chosen mailing-list provider before using it to collect subscribers.

## Deploy

Upload the folder contents to any static web host, such as GitHub Pages, Netlify, or Cloudflare Pages. The pages are static; no server or build command is needed. Configure HTTPS and verify the inquiry provider endpoint after deployment.

## Pre-launch checklist

- [ ] Confirm the logo variant and replace any future image placeholders with owned, optimized assets.
- [ ] Replace sample email, phone, WhatsApp link, Nairobi address, and working hours.
- [ ] Update the sample `welydnetworks.co.ke` Open Graph URLs if your production domain is different.
- [ ] Replace Facebook, Instagram, LinkedIn, X, and WhatsApp placeholder links.
- [ ] Set up a real Formspree endpoint and test inquiry delivery.
- [ ] Connect the newsletter to an email marketing provider.
- [ ] Confirm service inclusions, scope-dependent starting prices, and client results before publishing.
- [ ] Confirm permission to name clients and publish project details; replace sample team profiles and testimonials with approved information.
- [ ] Confirm the target audience and any partner/certification claims before adding them.
