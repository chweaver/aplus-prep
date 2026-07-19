# PBQ-Style Scenario Drills - Session 01 (Security+ SY0-701)

Target exam: late August 2026. Learner weak pairs (7/7 misses on July 1 diagnostic):
crypto key handling (TPM/HSM/escrow), sites (hot/warm/cold), backups
(snapshot/replication/journaling), CVE/CVSS, email security (SPF/DKIM/DMARC),
risk strategies (accept/transfer/avoid/mitigate), agreements (MOU/SLA/MSA/SOW).
Also drill IDS vs IPS, containment vs eradication, compensating vs corrective.

## How to run this session (instructions for the facilitator)

- One scenario per turn. Show ONLY the "PRESENT" block. Never show the KEY early.
- Learner answers free-text. Grade each sub-item against the KEY: full point,
  half point (right control, wrong reasoning or vice versa), or zero.
- After grading each scenario, give a brief WHY for each miss only. No praise
  filler. Then present the next scenario.
- Difficulty ramp: 1-3 straightforward, 4-7 moderate, 8-10 exam-hard or harder.
- After scenario 10: report hit rate as points earned / 40 total, plus a
  per-format and per-twin-pair breakdown, and the 3 weakest areas to re-drill.
- Formats: L = log analysis, O = IR ordering, C = control matching, N = network
  hardening. Mix: L x3 (1, 4, 8), O x2 (3, 7), C x3 (2, 6, 10), N x2 (5, 9).

Score sheet (fill in as you go):

| # | Format | Points possible | Earned |
|---|--------|-----------------|--------|
| 1 | L | 3 | |
| 2 | C | 4 | |
| 3 | O | 3 | |
| 4 | L | 4 | |
| 5 | N | 4 | |
| 6 | C | 4 | |
| 7 | O | 5 | |
| 8 | L | 5 | |
| 9 | N | 4 | |
| 10 | C | 4 | |
| **Total** | | **40** | |

---

## Scenario 1 (L, straightforward) - Auth log

### PRESENT

SSO authentication log, external IP, 09:01-09:24 UTC:

```
09:01:12 sso01 AUTH user=a.brown    result=FAIL reason=bad_password src=203.0.113.44
09:01:47 sso01 AUTH user=b.castillo result=FAIL reason=bad_password src=203.0.113.44
09:02:21 sso01 AUTH user=c.dawson   result=FAIL reason=bad_password src=203.0.113.44
09:02:58 sso01 AUTH user=d.eze      result=FAIL reason=bad_password src=203.0.113.44
  ... (36 more accounts, one failed attempt each, ~35s apart) ...
09:23:44 sso01 AUTH user=t.yamada   result=SUCCESS src=203.0.113.44
09:24:02 sso01 AUTH user=t.yamada   result=SUCCESS mfa=none src=203.0.113.44 geo=RU
```

1. Name the attack. (1 pt)
2. One log detail that rules out classic brute force. (1 pt)
3. BEST single control to stop this attack class going forward:
   stricter account lockout threshold, MFA on the SSO portal, longer password
   history, or geo-blocking RU source IPs? Say why the runner-up fails. (1 pt)

### KEY

1. Password spraying (one common password tried across many accounts).
2. Exactly ONE attempt per account, paced ~35s apart - designed to stay under
   lockout thresholds. Brute force = many attempts against ONE account.
3. MFA on the SSO portal. Lockout thresholds never trigger at one guess per
   account (that is the whole point of spraying); geo-blocking is trivially
   bypassed by pivoting source; password history does nothing against a first
   guess. MFA stops the compromised t.yamada login from becoming access.
   The tell: spraying = one password, many accounts; brute force = many
   passwords, one account.

---

## Scenario 2 (C, straightforward) - New branch office

### PRESENT

A company opens a small branch office. For each item, give the control
CATEGORY (technical / managerial / operational / physical) AND TYPE
(preventive / detective / corrective / deterrent / compensating / directive).
Half point per item; both halves right = full point. 4 gaps, 1 pt each:

- G1: Full-disk encryption enforced on all branch laptops.
- G2: A signed acceptable use policy that tells staff what they may do on
  company systems.
- G3: CCTV cameras recording the server closet door.
- G4: After a malware infection, the IT tech reimages the machine from a
  known-good image.

### KEY

- G1: Technical / preventive. Enforced by the system; stops data exposure
  before it happens.
- G2: Managerial / directive. A policy document that directs behavior.
  (Accept preventive as the type with a stated argument, but directive is the
  SY0-701 answer for "tells people what to do.")
- G3: Physical / detective. It records - it does not stop entry. (Deterrent is
  half credit only if they argue visibility; recording = detective.)
- G4: Technical / corrective. Fixes damage after the incident. The tell:
  corrective = repair after the event; compensating = alternate control when
  the primary one is not feasible.

---

## Scenario 3 (O, straightforward) - Phishing incident, scrambled IR

### PRESENT

A user reports a phishing email; EDR then alerts on a credential stealer
running on that laptop. Put these steps in the correct SY0-701 incident
response order (3 pts: full order 3, one adjacent swap 2, two swaps 1):

- A. Wipe the malware from the laptop and reset the user's credentials
- B. Hold a post-incident meeting and update the phishing playbook
- C. Disconnect the laptop from the network
- D. Confirm the alert is real and determine which accounts and hosts are affected
- E. Restore the laptop to service and watch for re-infection
- F. Maintain the IR plan, contact list, and EDR tooling (done before any incident)

Then: justify why C must come before A. (part of the 3 pts - no full credit
without a correct justification)

### KEY

Order: F, D, C, A, E, B
(Preparation -> detection/analysis -> containment -> eradication -> recovery ->
lessons learned.)
C before A: containment first stops spread and credential exfiltration while
you still control the timeline; eradicating first (A) leaves the network
exposed during cleanup and can tip the attacker to burn persistence elsewhere.
The tell: containment = stop the bleeding; eradication = remove the cause;
recovery = return to service.

---

## Scenario 4 (L, moderate) - Web server log

### PRESENT

Apache access log, one external IP, seconds apart:

```
198.51.100.7 "GET /reports?file=q2-summary.pdf HTTP/1.1" 200 48211
198.51.100.7 "GET /reports?file=../../../../etc/passwd HTTP/1.1" 200 2417
198.51.100.7 "GET /reports?file=../../../../etc/shadow HTTP/1.1" 403 199
198.51.100.7 "GET /reports?file=..%2f..%2f..%2f..%2fetc%2fpasswd HTTP/1.1" 200 2417
```

1. Name the attack, and cite the line detail showing a filter-evasion attempt. (1 pt)
2. The 200 on line 2 vs the 403 on line 3: what does that difference tell you
   about how far the attack got? (1 pt)
3. The team wants a control that would have BLOCKED this in real time without
   touching application code. Choose and defend: NIDS on a SPAN port, inline
   WAF, or inline IPS - and say why each rejected option loses. (2 pts)

### KEY

1. Directory traversal (path traversal). Line 4 URL-encodes the slashes
   (`..%2f`) to evade a naive filter that blocked literal `../` - wait, line 2
   already succeeded with literal `../`, so line 4 shows the attacker probing
   alternate encodings for reliability/evasion regardless.
2. 200 + 2417 bytes on /etc/passwd = the file WAS read (world-readable);
   403 on /etc/shadow = the web server process lacked permission - the OS
   permission model limited the blast radius, not the app.
3. Inline WAF (2 pts). It parses HTTP semantics, canonicalizes encodings
   (catches `..%2f`), and blocks in-line. NIDS on SPAN loses: detection only,
   a copy of traffic cannot block anything. Inline IPS is the strong runner-up
   (1 pt if chosen with correct reasoning) but is signature/protocol oriented
   and weaker on HTTP canonicalization than a WAF; "BEST without touching
   code" for a web attack = WAF. The tell: IDS = out-of-band copy, alerts
   only; IPS = inline, can drop; WAF = inline AND speaks HTTP.

---

## Scenario 5 (N, moderate) - Retail branch topology

### PRESENT

Topology description:

- One flat 192.168.10.0/24 network carries: two domain controllers, the POS
  terminals, office PCs, and the guest Wi-Fi.
- Network gear is managed over Telnet from any office PC.
- The perimeter firewall allows all outbound traffic ("any-any out").
- No logs leave any device; each box keeps its own.

Name the four highest-impact fixes, one per flaw, and for each say what attack
or failure it prevents. (4 pts, 1 each)

### KEY

1. Segment the network (VLANs + inter-VLAN ACLs): POS, servers, office, and
   guest each isolated; guest never routes internally. Prevents lateral
   movement from a phished office PC (or a guest device) to POS/DCs - and PCI
   expects POS isolation.
2. Replace Telnet with SSH and restrict management to a dedicated management
   VLAN or jump server. Prevents credential capture by on-path sniffing
   (Telnet is cleartext) and limits who can even reach device management.
3. Egress filtering on the firewall (allow only needed outbound ports/dests).
   Blunts C2 beaconing and data exfiltration after a compromise.
4. Centralized logging to a SIEM (or at minimum a syslog collector).
   Local-only logs = an attacker who owns the box owns its history; central
   copies enable detection and forensics.
   (Accept 802.1X/NAC on office ports or WPA3-Enterprise for guest/corp
   separation as an alternate for #1 or #2 with correct reasoning.)

---

## Scenario 6 (C, moderate) - Legacy server risk

### PRESENT

A hospital runs a lab analyzer controlled by a Windows Server 2012 box. The
vendor is defunct; patching breaks the analyzer driver. Assign category AND
type for each control the team deploys (half point per half, 4 gaps, 1 pt each):

- G1: The unpatched server is moved to its own VLAN that can talk only to the
  lab middleware on one port.
- G2: A NIDS sensor watches that VLAN and pages the SOC on any other traffic.
- G3: A new SOP requires monthly review of the analyzer VLAN firewall rules.
- G4: Warning signs on the lab door state that access is monitored and logged.

### KEY

- G1: Technical / compensating. The primary control (patching) is infeasible;
  segmentation substitutes for it. NOT preventive-full-stop: the exam wants
  compensating when the stem says "cannot patch." The tell: compensating =
  stand-in for a control you cannot apply; corrective = cleanup after damage.
- G2: Technical / detective. Sensor + alert = detect, not block (NIDS, not
  NIPS - IDS/IPS tell again).
- G3: Operational / preventive (accept managerial with argument; a procedure
  executed by people on a schedule is operational in SY0-701). Catches rule
  drift before it becomes exposure - accept detective with that argument for
  half.
- G4: Physical / deterrent. Signage discourages; it neither stops nor records.

---

## Scenario 7 (O, moderate) - Ransomware on the file server

### PRESENT

02:10: EDR flags mass file renames on FILESRV01. The org keeps hourly
snapshots plus continuous journaling on the file volume; the DR runbook exists.
Order these steps (5 pts: 3 for order with at most one adjacent swap, 2 for the
two justifications):

- A. Reimage FILESRV01 from the golden image and rotate its credentials
- B. Capture a memory image of FILESRV01
- C. Disable the server's switch port
- D. Validate scope: which shares, which client machines touched the renames
- E. Recover the file volume to 02:09 using the journal, not the 02:00 snapshot
- F. Watch the rebuilt server and shares for re-encryption before declaring normal ops
- G. Post-incident review; feed indicators back into EDR blocklists

Justify: (1) why B comes after C but before A; (2) why E uses the journal
instead of the snapshot.

### KEY

Order: D, C, B, A, E, F, G
(Accept C before D - contain-then-scope is defensible when encryption is
actively spreading; D-C-B-A core must not have A before B or B before C.)
Justification 1: cutting the switch port (C) stops spread without destroying
state; the memory image (B) must be taken BEFORE reimaging (A) because RAM
holds the process, keys, and C2 artifacts that the wipe destroys - order of
volatility.
Justification 2: journaling replays every write up to 02:09, one minute before
detection, losing ~nothing; the 02:00 snapshot discards 69 minutes of legit
work. The tell: snapshot = point-in-time copy at fixed moments; journaling =
continuous log of changes, restore to any second; replication = a live mirror
that would have happily mirrored the encryption.

---

## Scenario 8 (L, exam-hard) - Email authentication log

### PRESENT

Your company is acme-corp.com. The CFO's assistant reports an email from
"Acme CFO" requesting an urgent vendor wire change. Gateway log for it:

```
Authentication-Results: mx.acme-corp.com;
  spf=pass smtp.mailfrom=bounce@relay.mailblast-pro.example;
  dkim=pass header.d=relay.mailblast-pro.example;
  dmarc=fail (p=none) header.from=acme-corp.com
Received: from out7.relay.mailblast-pro.example (192.0.2.88)
From: "Miriam Okafor, CFO" <m.okafor@acme-corp.com>
Reply-To: cfo-acme@fastmail-secure.example
Subject: URGENT - updated wire instructions for Friday
```

1. SPF and DKIM both PASS, yet this message is spoofed. Explain precisely how
   both passes are legitimate results AND why they prove nothing here. (2 pts)
2. What single word in the dmarc= line explains why this reached the inbox,
   and what should it be changed to? (1 pt)
3. Name the attack. Not just "phishing" - the specific SY0-701 term, and the
   two header artifacts that mark it. (1 pt)
4. Besides the DNS fix, name the ONE operational control that kills this
   attack class even when email filtering fails. (1 pt)

### KEY

1. SPF checked the ENVELOPE sender (smtp.mailfrom = relay.mailblast-pro.example)
   and that relay IS authorized to send for its own domain - pass. DKIM: the
   signature is by header.d = relay.mailblast-pro.example and it verifies -
   pass. Neither is aligned with the visible From: acme-corp.com, which is
   the only address the human sees. That alignment check is DMARC's job -
   hence dmarc=fail. The tell: SPF = envelope sender vs sending IP; DKIM =
   signature by the signing domain; DMARC = do SPF/DKIM domains ALIGN with the
   visible From, plus policy.
2. "p=none" - monitor-only policy, so a DMARC fail still gets delivered.
   Change to p=reject (p=quarantine acceptable as a staged step).
3. Business email compromise (BEC): spoofed/impersonated executive identity +
   an urgent payment redirect, no malware or link needed. Artifacts: forged
   From at acme-corp.com and the mismatched Reply-To routing responses to an
   attacker mailbox.
4. An out-of-band payment verification procedure: any banking-detail change
   is confirmed by voice on a known number (callback verification) before
   funds move. (Accept dual approval for wire changes.)

---

## Scenario 9 (N, exam-hard) - Post-acquisition integration review

### PRESENT

You inherit a subsidiary's environment:

- Web servers hold their TLS private keys as files on local disk; admins copy
  them between boxes over SMB when renewing certs.
- Admins RDP straight from their daily-driver laptops to production servers.
- A NIDS hangs off a SPAN port; last quarter it alerted on an active intrusion
  that proceeded anyway.
- Site-to-site traffic to HQ crosses the internet as cleartext because "the
  apps encrypt the important stuff."
- Backups are synchronous replication to a second array in the same rack, and
  nothing else.

Give the correct fix for each of the five findings - name the specific
technology and one sentence on why the current state fails. (4 pts: 5 findings,
0.8 each; be strict on the key-storage and backup items - they carry the
twin-term pairs.)

### KEY

1. Keys: store/generate TLS private keys in an HSM (network HSM or per-server
   PKCS#11), never as copyable disk files. HSM = removable/networked hardened
   key vault for servers at scale; TPM would bind keys to ONE motherboard -
   wrong tool for keys that certs rotate across a farm. The tell: TPM =
   soldered to one device; HSM = dedicated key appliance; escrow = a copy held
   by a third party for recovery, not an operational store.
2. Admin access: a hardened jump server (bastion) in a management zone, MFA,
   with PAM session recording; daily-driver laptops are phishing surface and
   must never touch production directly.
3. Detection: move to an inline IPS (or convert the sensor) so intrusions are
   DROPPED, not narrated. SPAN-fed NIDS sees a copy after the fact. The tell:
   IDS = detects on a copy; IPS = sits inline and blocks.
4. Transit: IPSec site-to-site tunnel (or TLS across the board) - "apps
   encrypt the important stuff" leaves credentials, DNS, and legacy protocols
   readable to any on-path party.
5. Backups: same-rack synchronous replication mirrors corruption and
   ransomware instantly and dies with the rack. Add offline/immutable backups
   plus point-in-time recovery (snapshots and/or journaling), tested restores,
   offsite copy. The tell: replication = availability mirror, not history;
   snapshots/journal = you can go back in time; offline/immutable = ransomware
   cannot reach it.

---

## Scenario 10 (C, exam-hard) - Vulnerability report triage

### PRESENT

Quarterly scan results land on your desk:

- V1: CVE-2026-31337, CVSS 9.8, pre-auth RCE on the internet-facing booking
  API. Vendor patch exists. You schedule an emergency change window tonight.
- V2: The same scan flags the booking API's cloud hosting as a
  single-point-of-failure risk; leadership signs a cyber-insurance policy
  covering breach costs instead of re-architecting this quarter.
- V3: CVSS 2.4 information disclosure on an internal print server reachable
  only from the office VLAN. The team documents it and moves on.
- V4: An end-of-life photo-kiosk microsite has the same RCE with no patch
  path; the business retires the microsite entirely this week.

1. For V1-V4, name the risk response strategy each decision represents. (2 pts,
   half each)
2. Your manager says "CVE 9.8" in the meeting. What is wrong with that
   sentence? One line. (1 pt)
3. The MSP that hosts the booking API must apply tonight's patch. Which
   agreement document defines how fast they are REQUIRED to act, and which
   document would instead only describe the general intent to cooperate on
   security? (1 pt)

### KEY

1. V1 = mitigate (patch reduces the risk). V2 = transfer (insurance shifts
   financial impact; the vulnerability remains). V3 = accept (documented,
   low severity, no action). V4 = avoid (eliminate the activity entirely).
   The tell: mitigate = reduce it, transfer = make it someone else's money
   problem, accept = knowingly live with it, avoid = stop doing the thing.
2. 9.8 is a CVSS score, not a CVE. CVE is the catalog IDENTIFIER of the
   vulnerability; CVSS is the numeric SEVERITY rating of it. "CVE 9.8"
   conflates the name with the grade.
3. Required speed = the SLA (measurable targets - e.g., critical patches
   within 24h - with penalties). General intent to cooperate = an MOU
   (non-binding statement of mutual intent). The tell: SLA = numbers plus
   penalties; MOU = intent, no teeth; MSA = the master framework the SLA and
   SOWs hang off.

---

## End-of-session report template

- Hit rate: X / 40 (Y%)
- By format: L _/12, O _/8, C _/12, N _/8
- Twin pairs touched and result: spraying-vs-brute-force (S1), corrective-vs-
  compensating (S2, S6), containment-vs-eradication (S3, S7), IDS-vs-IPS
  (S4, S6, S9), snapshot-vs-journaling-vs-replication (S7, S9), TPM-vs-HSM-vs-
  escrow (S9), SPF-vs-DKIM-vs-DMARC (S8), CVE-vs-CVSS (S10), risk strategies
  (S10), SLA-vs-MOU-vs-MSA (S10)
- Three weakest areas and the app families to drill next (map: use the family
  names from data/families.js, e.g. ips-ids, backups, crypto-key-handling,
  email-security, cve-cvss, risk-strategies, agreements).
