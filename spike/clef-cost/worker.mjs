// Throwaway for issue #11. Synthetic text only: nothing from the owner's profile.
const CLEF = "@cf/cloudflare/clef";

const LEVELS = ["Very weak", "Weak", "Partial", "Strong", "Excellent"];
const Q = {
  technical: { type: "score", instructions: "How well do the candidate's technical skills match the technologies and responsibilities the offer requires?", criteria: LEVELS },
  experience: { type: "score", instructions: "How well does the candidate's seniority and years of experience match what the offer asks for?", criteria: LEVELS },
  behavioral: { type: "score", instructions: "How well do the candidate's working style and soft skills match the team and culture the offer describes?", criteria: LEVELS },
  career: { type: "score", instructions: "How well does this role move the candidate toward their stated career goals?", criteria: LEVELS },
  location: { type: "noul", instructions: "Does the offer's location and work mode satisfy the candidate's requirements (fully remote, Spain/EU hours)?" },
  language: { type: "noul", instructions: "Does the offer's working language satisfy the candidate's language requirements?" },
};

const SENTENCES = [
  "Built and operated REST and event-driven services in TypeScript on Node.js with Postgres and Redis.",
  "Led migration of a monolith to services, owning design docs, on-call rotation and incident reviews.",
  "Prefers small product teams, async communication, written decisions and fully remote work.",
  "Comfortable with Kubernetes, Terraform, CI pipelines and observability tooling in production.",
  "Wants growth toward staff-level technical leadership and mentoring rather than people management.",
  "Speaks fluent English and Spanish; works within European time zones and avoids on-site requirements.",
];
const fill = (chars, seed) => {
  let s = "";
  for (let i = seed; s.length < chars; i++) s += SENTENCES[i % SENTENCES.length] + ` (item ${i}) `;
  return s.slice(0, chars);
};

const STATES = {
  tiny: { profile: "Backend engineer, remote only.", offer: "Backend Engineer, fully remote, TypeScript." },
  full: { profile: fill(3200, 0), offer: fill(6000, 3) },
  fullx2: { profile: fill(6400, 0), offer: fill(12000, 3) },
};
const QSETS = {
  q1: ["technical"],
  q2: ["technical", "experience"],
  q6: Object.keys(Q),
};

export default {
  async fetch(req, env) {
    const u = new URL(req.url);
    const state = u.searchParams.get("state") ?? "full";
    const qs = u.searchParams.get("q") ?? "q1";
    const questions = Object.fromEntries(QSETS[qs].map((k) => [k, Q[k]]));
    const t0 = Date.now();
    const raw = await env.AI.run(CLEF, { model: "clef", state: STATES[state], questions });
    return Response.json({
      state, q: qs,
      chars: { profile: STATES[state].profile.length, offer: STATES[state].offer.length },
      ms: Date.now() - t0,
      usage: raw.usage,
      answerKeys: Object.keys(raw.answers ?? {}),
    });
  },
};
