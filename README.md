# GA4 E-commerce Tracking via GTM: Forge Athletica Demo Store

> A fictional gym-wear store built to practise and demonstrate GA4 e-commerce tracking implemented through Google Tag Manager and a custom dataLayer.

**Live demo:** [https://dayo757.github.io/ga4-ecommerce-tracking/](https://dayo757.github.io/Ga4-E-commerce-tracking-/)

## Goal
_One or two lines: what you set out to implement and why._

## Tracking plan

| Event | Page / trigger | Key parameters | Status |
|---|---|---|---|
| view_item_list | Home page load | | ☐ |
| select_item | Product card click | | ☐ |
| view_item | Product page load | | ☐ |
| add_to_cart | "Add to basket" click | | ☐ |
| remove_from_cart | "Remove" click in basket | | ☐ |
| view_cart | Basket page load | | ☐ |
| begin_checkout | Checkout page load | | ☐ |
| add_shipping_info | "Continue to payment" | | ☐ |
| add_payment_info | "Place order" | | ☐ |
| purchase | Thank-you page load | | ☐ |

## dataLayer specification
_Paste the push for each event and explain the structure (items array, currency, value)._

## GTM configuration
_Screenshots of tags, triggers and variables. Link to the exported container: `gtm/container.json`._

## QA & validation
_GTM Preview and GA4 DebugView screenshots showing each event and its parameters._

## Issues & fixes
_What broke, how you found it, how you fixed it. Example: duplicate purchase events on refresh._

## What I'd do next
_e.g. server-side GTM, Meta Conversions API with deduplication, Consent Mode v2._

---

### Project structure
```
index.html          product listing
product.html        product detail (?id=FA-001)
cart.html           basket
checkout.html       delivery + payment steps
thank-you.html      order confirmation
shop.js             store logic. Search for "TODO dataLayer"
style.css           styling
```
