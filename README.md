# cohort

**Clinical trial recruitment where the sponsor never sees a patient's chart.**

Trial sponsors need to know a candidate qualifies. They do not need, and under HIPAA/GDPR often may not hold, the biomarker values, diagnosis codes or staging that prove it. cohort moves the eligibility check into a zero-knowledge circuit on Midnight.

---

### A patient's path through it

> Dana's oncologist works at an accredited hospital. The hospital commits a hash of Dana's chart to the ledger. A sponsor opens a trial requiring biomarker >= 250 pg/mL, condition 704, stage 2 or higher.
>
> Dana applies. Her browser proves, privately, that the committed chart satisfies those criteria. The sponsor receives an anonymous enrollment receipt and nothing else.
>
> When recruitment closes, a draw ticket derived from on-chain data selects the cohort, so the sponsor cannot hand-pick who gets in. Dana confirms participation with the same receipt.

### What is public vs. private

| Data | Ledger | Patient device |
| --- | :---: | :---: |
| Biomarker value, condition, stage | no | yes |
| Chart commitment (hash) | yes | yes |
| Which hospital is accredited | yes | n/a |
| Enrollment receipt | yes | yes |
| Patient identity | no | yes |

### Contract surface

- `registerHospital`: sponsor/admin accredits a hospital key
- `registerPatientChart`: accredited hospital commits a chart
- `createTrial`, `closeRecruitment`, `acceptCandidate`: sponsor-only
- `applyForTrial`: patient proves `satisfiesTrialCriteria` against the committed chart
- `generateCohortDrawTicket`: verifiable blind selection
- `confirmParticipation`: patient completes enrollment

Charts self-reported by patients are rejected. Only a hospital on the accredited list can commit one.

### Try it

```
npm install
npm test
npm run demo
npm run dev
```

In the web app, the **Run on compiled contract** panel executes the compiled `cohort.compact` circuits in the browser tab through `@midnight-ntwrk/compact-runtime`.

Apache-2.0.
