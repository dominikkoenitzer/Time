# Security Policy

## Reporting a vulnerability

Please report security issues **privately** — do not open a public GitHub issue for anything security-sensitive.

- Preferred: open a [private security advisory](https://github.com/dominikkoenitzer/Time/security/advisories/new) on this repository.
- Alternatively: email **dominik.koenitzer@gmail.com** with the details.

Please include:

- a description of the issue and its impact,
- steps to reproduce (a URL, request, or minimal example), and
- any relevant logs, screenshots, or proof of concept.

## What to expect

- An acknowledgement of your report, typically within a few days.
- An assessment and, where applicable, a fix deployed to the live site.
- Credit for the report if you would like it, once the issue is resolved.

## Scope

This is a static, client-rendered website. It has a single server endpoint (`/api/time`) that returns the server's current time and nothing else; it stores no accounts and no personal data on a server. The only saved preference — light or dark theme — lives in the visitor's own browser via `localStorage`.

Reports most relevant to this project include cross-site scripting, content-injection, dependency vulnerabilities, and anything that could mislead a visitor about the displayed time.
