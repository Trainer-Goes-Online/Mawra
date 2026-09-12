# Calendly intake questions — 1:1 Diagnostic Call with Mawra Ishaque

Source: `mawra_checkout_spec.pdf`, Section 3.

These questions are **configured inside Calendly**, not in this codebase. They
appear after the invitee picks a date and time on the embedded calendar at
[`/book-a-call`](../app/book-a-call/page.tsx).

## Where to set them up

1. Calendly → **Event Types** → open the 1:1 diagnostic call event.
2. **Invitee Questions** → add each question below, in this order.
3. Leave the event's confirmation page as the **Calendly default** (no custom
   redirect). The embed listens for `calendly.event_scheduled` and forwards the
   invitee to `/thank-you` itself. A Calendly-side redirect would add a "You are
   leaving Calendly" interstitial inside the iframe.
4. Set the event duration to **60 minutes** — Question 8 commits the invitee to
   a 60-minute conversation.

## Fields already prefilled by the checkout

The checkout passes these through, so do not ask for them again:

| Calendly field | Comes from |
|---|---|
| Name | First + last name at checkout |
| Email | Email at checkout |
| Phone (event location field) | Phone at checkout |

---

## Question 1 · Single Select (Radio) · Required

**Where are you right now? How much weight are you looking to lose?**

Helper text: *Select the option that best describes your goal.*

- I'm looking to lose around 10–20 kgs
- I'm looking to lose around 20–30 kgs
- I'm looking to lose around 30–40 kgs
- I'm looking to lose around 40–50 kgs
- I'm looking to lose 50 kgs or more
- Weight loss isn't my primary goal — I'm focused on my health conditions and energy

---

## Question 2 · Single Select (Radio) · Required

**What is your primary goal for the next 90 days?**

- Release stubborn weight that hasn't shifted despite trying multiple times
- Reverse health conditions (thyroid, PCOS, BP, endometriosis, insomnia, migraine, or similar)
- Fix my relationship with food and stop the cycle of emotional eating and starting over
- All of the above — body, energy, and identity

---

## Question 3 · Multi Select (Checkboxes)

**What have you tried so far?**

Helper text: *Select all that apply.*

- Keto or low carb
- Intermittent fasting
- Calorie counting or portion control
- A nutritionist or dietitian
- Gym or personal trainer
- Supplements or wellness products
- I haven't tried anything structured yet

---

## Question 4 · One Line Text · **Required**

**What do you do? (Please mention your - \<Designation\> @ \<Company\> Eg. Associate VP @ IBM )**

Placeholder: `Associate VP @ IBM`

---

## Question 5 · Single Select (Radio) · Required

**Which of these is closest to your situation right now?**

- I earn my own independent income from a job, practice, or business
- I work in a family or spouse's business and draw my own income from it
- I'm on a career break and planning to return
- I'm not earning independently at the moment

---

## Question 6 · Single Select (Radio) · Required

**Mawra works with a small group of women for 90 days at a time. Which of these best describes the level of support you're looking for and are ready to invest in?**

- World-class coaching with direct access to Mawra and full identity transformation (approx. ₹20,000–25,000/month)
- Premium coaching with a structured plan and group support (approx. ₹15,000–20,000/month)
- I want this support but not at a premium level right now (I can only invest ₹10,000/month)
- I'm not looking to invest money in my health at this point

---

## Question 7 · Single Select (Radio) · Required

**How will the decision to start be made?**

- I am the sole decision maker and go ahead on my own
- My spouse or family is part of the decision — I will bring them onto the call with me
- My spouse or family is part of the decision — I will speak to them before the call so we are aligned
- Someone else would need to pay for this and I have not spoken to them about it yet

---

## Question 8 · Single Select (Radio) 1–10 · Required

**On a scale of 1 to 10, how committed are you to solving this properly right now?**

Helper text: *Type a number between 1 and 10, or select below.*

Options: `1` `2` `3` `4` `5` `6` `7` `8` `9` `10`

> Calendly has no numeric slider input. Use a single-select radio with the ten
> values above, which matches the spec's row of number buttons.

### Question 8b · Checkbox · **Required — submission must be blocked without it**

**I understand this is a 60-minute conversation with Mawra and I will be somewhere quiet and uninterrupted at the time I have chosen.**

> ⚠️ In Calendly, add this as a **single checkbox question marked Required**.
> Calendly then refuses to submit the form until it is ticked, which is exactly
> what the spec demands. Verify this by trying to submit without ticking it
> before going live.
