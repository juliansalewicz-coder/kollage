# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js 15 (App Router) + TypeScript, plain CSS. Confirmed by the user on 2026-10-01 (same stack as the owner's FitLoop project).
MVP persistence is browser-local (localStorage) behind a small store module so a real backend can replace it later.

## Users

Fashion-interested people in Switzerland (first market; DACH later) who like to plan and share looks the way they would on a moodboard. They browse on phone, tablet and desktop. Two jobs:

- Creators: put together an outfit from real, buyable pieces and share or publish it.
- Visitors: look at published outfits, pick single pieces and buy them at the retailer.

Inferred from the brief (not interviewed): age range and style segment are open.

## Product Purpose

One responsive website where users compose outfit collages from a searchable product gallery (tops, bottoms, shoes, bags, accessories) on a digital canvas, like a fashion moodboard. Published looks link every real product to its retailer offer through an affiliate link. Retailers handle checkout, payment and shipping; the owner earns commission on attributed, confirmed purchases.

Success for the MVP: a guest can build a look in the browser, sign in only when saving or publishing without losing the draft, publish it, and a visitor can open the look and reach the retailer for each piece.

## Positioning

The look is the shopping list: every item on the collage is a real retail offer with price in CHF and Swiss delivery, so inspiration and purchase are one step apart. The builder makes visual collages, not body simulation.

## Operating Context

- Language: German (de-CH spelling, no ß). Currency: CHF. Delivery to Switzerland must be shown per offer.
- Pages: Startseite, Entdecken, Outfit-Builder, Outfit-Seite, Meine Looks. One navigation, one design system.
- Guests can design and browse. Login is required only to save permanently or publish. The current draft survives login.
- Affiliate disclosure must be visible where links to retailers appear.

## Capabilities and Constraints

- Real buyable products must use authentic retailer images with matching usage rights (from affiliate feeds or retailer approval).
- AI-generated or illustrated garments may only appear as clearly labelled demo or inspiration material, never as the image of an offered article.
- Body simulation / virtual try-on is a later stage, out of MVP scope.
- Open: which affiliate networks and retailers; real product feed; auth provider; backend; final brand name ("Kollage" is a working title).

## Brand Commitments

- Working title "Kollage" (placeholder, not final).
- Visual reference from the brief: cut-out product images on a light surface, arranged like a fashion moodboard. (The reference image itself was not attached to the session.)
- Visual direction set by the user on 2026-10-01: bright, reduced, precise, Apple-inspired. White #FFFFFF, secondary #F5F5F7, ink #1D1D1F, secondary text #626267, accent #0071E3; system font stack; sentence-case headings; 12–16 px radii; motion 150–250 ms. Hero copy: "Stelle deinen Look zusammen." / "Kombiniere Kleidung und Accessoires zu deinem Outfit. Entdecke die passenden Shops."
- Imagery: Higgsfield is the generation tool (connected, free plan).

## Evidence on Hand

No real products, retailers, prices, affiliate contracts, testimonials, user numbers or press exist. The MVP catalogue is demo data with fictional demo shops and example prices, all labelled as such. Never present demo data as real offers.
- AI-generated demo product renders (Higgsfield z_image): `public/products/*.webp`, provenance in `docs/higgsfield/`.
- Higgsfield design reference for the start page: `docs/higgsfield/ref-startseite.png`.

## Product Principles

1. Pieces are the heroes. The collage and the products carry the page; interface chrome recedes.
2. Every item is a way to the shop. Each piece on a look shows price, shop and Swiss delivery, and leads to the offer in one action.
3. Design first, account later. Nothing blocks a guest until they want to keep or publish.
4. Honest commerce. Affiliate links are disclosed; demo material is labelled; no invented claims.
5. Same feel on every screen size. The builder works by touch on a phone, not only with a mouse.

## Accessibility & Inclusion

WCAG 2.2 AA. Builder actions (add, move, resize, layer, remove) must also work by keyboard and buttons, not only by drag. Respect prefers-reduced-motion.
