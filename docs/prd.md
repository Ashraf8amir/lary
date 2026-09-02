# Product Requirements Document (PRD)

## AI Shopping Assistant & Customer Insights Platform for Salla Stores

**Document Status:** Draft  
**Audience:** Client / Stakeholders  
**Product Type:** AI-powered customer shopping assistant and analytics platform  
**Target Platform:** Salla merchants

---

# 1. Product Overview

The product is an AI-powered shopping assistant designed for Salla stores.

The assistant appears directly inside the merchant's online store and acts as an intelligent conversational layer between the customer and the store's product catalog.

Instead of requiring customers to browse through multiple categories, filters, and product pages, they can simply communicate with the store in natural language.

For example:

> "I need a black running shoe, size 42, under 400 SAR."

The assistant understands the customer's request, identifies the most relevant products, and presents them directly within the conversation.

Customers can then add products to their cart without leaving the conversation.

The assistant is not limited to direct product searches. Customers can also ask indirect shopping-related questions (e.g., gift ideas, general product advice), and the assistant should respond naturally, while staying within the scope of shopping and the store (see 13.1 Scope Boundary for Conversations).

---

# 2. Problem Statement

Traditional e-commerce stores rely heavily on customers navigating the website themselves.

Customers often have to:

- Browse categories
- Search using exact product names
- Apply filters
- Open multiple product pages
- Compare products
- Check available options
- Return to search results
- Add products to their cart

This can create friction, especially when customers know what they want but do not know the exact product name or where to find it.

For example, a customer may know:

> "I want a white sneaker for daily use, size 42, preferably under 300 SAR."

But they may not know which product name or category to search for.

At the same time, merchants currently have limited visibility into what customers are asking for through conversational interactions.

A merchant may not know:

- Which products customers frequently ask about
- Which products are frequently added to carts through the assistant
- Which products or variants customers are looking for but cannot find
- Which customer requests represent potential missed opportunities
- How much potential shopping value is being influenced by the assistant

The product aims to solve both sides of this problem.

---

# 3. Product Vision

Create an intelligent shopping assistant that makes product discovery easier for customers while giving merchants actionable insights into customer demand and shopping behavior.

The product should help merchants understand:

> **What customers are looking for, what they are interested in, what they add to their cart, and what opportunities may be missed.**

---

# 4. Goals

## Customer Goals

The customer should be able to:

1. Interact with the store using natural language.
2. Ask for products without knowing their exact names.
3. Describe products using attributes such as:
   - Color
   - Size
   - Category
   - Price range
   - Style
   - Use case
   - Brand
4. Receive relevant product recommendations.
5. Ask follow-up questions about products.
6. Add recommended products to the cart directly from the conversation.
7. Ask general questions and receive useful responses even when the question is not directly related to purchasing a product.

## Merchant Goals

The merchant should be able to:

1. Install and connect the assistant to their store.
2. Access a dedicated dashboard.
3. Understand customer interactions with the assistant.
4. See the products customers are most interested in.
5. See products frequently added to carts through the assistant.
6. Understand what customers are searching for.
7. Identify products or variants customers frequently request but cannot find.
8. Identify potential lost opportunities.
9. Understand the potential shopping value influenced by the assistant.
10. Use customer demand insights to improve their product catalog and inventory decisions.

---

# 5. Target Users

## Primary User: Salla Merchant

The primary customer of the platform is the merchant who owns and operates a Salla store.

The merchant uses the product to:

- Improve customer product discovery
- Increase shopping engagement
- Understand customer demand
- Discover potential inventory gaps
- Monitor shopping activity influenced by the assistant

## Secondary User: Store Customer

The store customer interacts with the AI assistant while shopping on the merchant's website.

The customer does not need to understand that they are interacting with an analytics platform.

For them, the assistant should simply feel like an intelligent store assistant.

---

# 6. Core Product Experience

The product consists of two primary experiences:

### Customer Experience

The AI shopping assistant inside the merchant's store.

### Merchant Experience

A dedicated dashboard where the merchant can monitor insights generated from customer interactions.

---

# 7. Customer Experience

## 7.1 Assistant Entry Point

The assistant should be visible inside the merchant's store.

Customers can open the assistant and start a conversation.

Example:

> "Hi! What are you looking for today?"

---

# 8. Natural Language Product Discovery

Customers should not be required to use structured search filters.

They can describe what they want naturally.

### Language and Dialect Support

The assistant must understand not only Modern Standard Arabic, but also Gulf and Saudi dialect expressions commonly used by Salla's customer base (for example, colloquial words for "I want" or "a lot," and informal ways of naming products or prices). This directly affects the accuracy of matching customer requests to catalog products.

### Example

Customer:

> "I need a black running shoe for men, size 42."

The assistant analyzes the request and presents relevant products.

Example response:

> "I found a few options that match your request."

Then it presents products with relevant information such as:

- Product image
- Product name
- Price
- Available options
- Relevant attributes
- Add to Cart action

---

# 9. Conversational Product Search

The assistant should understand follow-up questions.

For example:

### Customer

> "Show me black sneakers."

### Assistant

Shows relevant products.

### Customer

> "Which one is cheaper?"

The assistant should understand that the customer is referring to the products already discussed.

---

# 10. Product Recommendations

The assistant should recommend relevant products based on the customer's request.

Recommendations may consider:

- Product name
- Category
- Brand
- Price
- Color
- Size
- Attributes
- Available variants
- Customer requirements

The goal is to reduce the effort required for customers to discover suitable products.

---

# 11. Add to Cart From the Conversation

Customers should be able to add a product to their cart directly from the assistant.

Example:

> Customer: "I'll take the second one."

The assistant can respond:

> "Sure. I've added it to your cart."

The customer should not need to leave the conversation to add the product.

---

# 11.1 Catalog Data Freshness

Product data (price, stock, variants) must stay reasonably fresh so the assistant never recommends or adds unavailable products with confidence.

The platform will use a **hybrid approach**:

- **Cached catalog data** is used for browsing, search, and recommendations, for speed and lower load on Salla's API.
- **Real-time verification** is performed at the moment of Add to Cart, confirming price and stock availability before the item is added.

This ensures customers are never shown stale search results as a hard blocker to performance, while guaranteeing that anything actually added to the cart is verified as available at that moment.

---

# 12. Product and Store Questions

The assistant should not behave like a simple product search engine.

Customers may ask questions such as:

> "What shoes do you recommend for walking?"

> "What's the difference between these two products?"

> "Do you have something cheaper?"

> "Which one would be better for everyday use?"

The assistant should provide helpful responses when the required information is available.

---

# 12.1 Escalation to Human Support

The assistant is not expected to resolve every type of request (e.g., complaints, order issues, or questions it cannot confidently answer).

When the assistant cannot help, it should:

- Clearly acknowledge that it cannot assist with the request
- Direct the customer to the store's normal support channels (e.g., WhatsApp, ticket, or email, as configured by the merchant)

This ensures customers are never left stuck in the conversation without a path forward.

---

# 13. General Questions

The assistant should also be capable of responding naturally to questions that are not directly about purchasing.

For example:

> "What can you help me with?"

> "I'm looking for something for a birthday gift."

> "Can you help me choose?"

The assistant should maintain a helpful conversational experience rather than responding only when a direct product search is detected.

---

# 13.1 Scope Boundary for Conversations

The assistant should remain focused on shopping-related conversation, even when the request is not a direct product search.

**In scope (allowed):**

- Direct product requests
- Indirect shopping-related requests, such as:
  - "I'm looking for a birthday gift for my friend."
  - "What do you recommend for winter?"
  - Product comparisons and general shopping advice

**Out of scope (not allowed):**

- Requests unrelated to the store or shopping, such as writing code, answering general knowledge questions, or performing unrelated tasks

When a customer asks for something out of scope, the assistant should politely decline and redirect the conversation back to how it can help with shopping in the store, rather than attempting to fulfill the unrelated request.

---

# 14. Out-of-Scope Shopping Actions

The assistant's shopping responsibility ends at **Add to Cart**.

It is not responsible for:

- Checkout
- Payment
- Order creation
- Payment confirmation
- Order fulfillment
- Shipping management
- Order tracking

The customer can continue the normal store journey after adding products to the cart.

---

# 15. Merchant Dashboard

The merchant receives a dedicated dashboard that provides insights generated from conversations and shopping interactions.

The dashboard should transform raw interactions into useful business insights.

---

# 16. Dashboard Overview

The dashboard should provide a high-level summary of assistant performance and customer demand.

Example metrics:

### Conversations

> 1,248 conversations

### Product Searches

> 864 product searches

### Products Added to Cart

> 312 products

### Potential Cart Value

> 42,850 SAR

### Potential Missed Opportunities

> 8,400 SAR

These metrics are intended to show the value and commercial impact influenced by the assistant.

---

# 17. Potential Cart Value

Because the assistant does not control checkout or payment, it should not claim that these interactions generated actual revenue.

Instead, the product should use terminology such as:

> **Potential Cart Value**

or

> **Expected Value**

Example:

> Customers added products worth 42,850 SAR to their carts through the assistant.

This represents the value of products added to carts through the assistant.

It does **not** mean that 42,850 SAR was actually paid.

---

# 17.1 Actual Conversion Tracking

To strengthen the "Honest Analytics" principle, the platform should go beyond showing potential value and also measure how much of that potential is actually realized.

By integrating with Salla's order webhooks (e.g., order created / order paid), the platform can attribute paid orders back to the specific Add to Cart action that originated from the assistant.

This enables two additional metrics:

### Conversion Rate

> 18% of products added to cart through the assistant were converted into paid orders.

### Realized Value

> The assistant contributed 12,400 SAR in confirmed, paid sales this month.

This gives merchants a credible, verifiable ROI figure alongside the potential/expected value metrics, and helps the product team understand which types of recommendations actually drive sales versus which ones don't convert.

**Note:** This requires tracking a link between each assistant-driven Add to Cart action (e.g., via a conversation/session identifier) and the resulting order, so it can be matched later.

---

# 18. Product Performance

The dashboard should show which products customers interact with most through the assistant.

Example:

| Product       | Views | Add to Cart | Potential Value |
| ------------- | ----: | ----------: | --------------: |
| Nike Air Max  |   320 |         124 |      43,400 SAR |
| Black T-Shirt |   250 |          91 |      12,740 SAR |
| Running Shoes |   190 |          62 |      18,600 SAR |

This helps merchants understand which products are receiving the most interest through conversational shopping.

---

# 19. Most Added Products

The merchant should be able to identify the products most frequently added to carts through the assistant.

Example:

> **Top Products Added Through AI Assistant**

1. Nike Air Max — 124 additions
2. Running Shoes — 91 additions
3. Black Hoodie — 76 additions
4. Classic Sneakers — 61 additions

This provides merchants with direct evidence of product interest generated through the assistant.

---

# 20. Customer Demand Insights

One of the most valuable parts of the platform is identifying what customers are asking for when the desired product is unavailable.

For example:

> **32 customers asked for:**  
> Nike Air Max — Size 42

> **Potential missed value:**  
> 8,400 SAR

This can indicate an inventory or product availability opportunity.

---

# 21. Lost Opportunities

The dashboard should highlight potential opportunities where customer demand could not be satisfied.

Example:

## Potential Lost Opportunities

> ⚠️ 32 customers requested Nike Air Max in size 42.

> Product exists, but the requested variant was unavailable.

> Potential missed value: 8,400 SAR

Another example:

> ⚠️ 18 customers searched for a black running shoe under 300 SAR.

> No matching product was available.

This information helps merchants identify demand that their current catalog may not satisfy.

---

# 22. Demand Trends

The merchant should be able to identify recurring customer requests.

For example:

> "Size 42 running shoes"

> "Black formal shoes"

> "Affordable wireless headphones"

> "Large-size hoodies"

If a specific request appears repeatedly, the merchant can consider:

- Adding new products
- Increasing inventory
- Adding missing variants
- Expanding product categories
- Adjusting pricing
- Improving product availability

---

# 23. Product Availability Insights

The platform should help merchants distinguish between different types of customer demand.

For example:

### Product Not Found

Customers are searching for something that does not appear to exist in the store's catalog.

### Variant Unavailable

The product exists, but the requested option is unavailable.

Examples:

- Size
- Color
- Model
- Configuration

This distinction makes the insights more actionable.

---

# 24. Analytics Time Periods

The merchant should be able to view insights over different periods.

Examples:

- Today
- Yesterday
- Last 7 days
- Last 30 days
- Custom date range

This allows merchants to identify trends and compare performance over time.

---

# 25. Customer Interaction Insights

The platform should provide visibility into how customers interact with the assistant.

Examples:

- Number of conversations
- Product searches
- Product views
- Product recommendations
- Add-to-cart actions
- Frequently requested products
- Frequently unavailable products

The goal is not simply to show activity numbers, but to turn activity into actionable information.

---

# 26. Business Value

The product provides merchants with two major benefits.

## Benefit 1: Better Customer Experience

Customers can discover products faster and more naturally.

Instead of:

> Search → Filter → Browse → Compare → Product Page → Cart

They can simply:

> Ask → Discover → Choose → Add to Cart

## Benefit 2: Customer Demand Intelligence

Every conversation can provide useful signals about what customers want.

The merchant can discover:

> What are customers asking for?

> What products are they interested in?

> What products are being added to carts?

> What products are unavailable?

> Which customer requests happen repeatedly?

This turns conversational interactions into a source of business intelligence.

---

# 27. Key Differentiator

The product is not simply an AI chatbot.

The core value proposition is:

> **AI Shopping Assistant + Customer Demand Intelligence**

The assistant helps customers shop while simultaneously helping merchants understand customer intent.

---

# 28. Example End-to-End Customer Journey

### Step 1 — Customer Opens Assistant

> "Hi! What are you looking for?"

### Step 2 — Customer Describes Need

> "I need a black running shoe, size 42, under 400 SAR."

### Step 3 — Assistant Understands Request

The assistant identifies the relevant product requirements.

### Step 4 — Products Are Presented

The customer receives several relevant products.

### Step 5 — Customer Asks Follow-Up

> "Which one is better for daily walking?"

The assistant provides a helpful comparison.

### Step 6 — Customer Chooses Product

> "I'll take the second one."

### Step 7 — Product Added to Cart

The product is added directly to the customer's cart.

### Step 8 — Interaction Becomes an Insight

The merchant dashboard can reflect:

> Product added to cart through the assistant.

The value of that interaction contributes to the platform's **Potential Cart Value** metric.

---

# 29. Example Lost Opportunity Journey

### Step 1

Customer:

> "Do you have Nike Air Max size 42?"

### Step 2

The assistant identifies that the requested variant is unavailable.

### Step 3

The assistant responds helpfully:

> "I don't currently have that size available, but I can show you similar options."

### Step 4

The interaction becomes a demand signal.

The dashboard can later show:

> **32 customers requested Nike Air Max — Size 42**

> **Potential missed value: 8,400 SAR**

The merchant can then decide whether to restock that variant.

---

# 30. Success Metrics

The product's success should be evaluated using metrics such as:

### Customer Engagement

- Number of conversations
- Number of product searches
- Number of product interactions

### Shopping Engagement

- Add-to-cart actions
- Products added to carts
- Potential Cart Value

### Customer Demand

- Frequently requested products
- Frequently unavailable variants
- Repeated customer requests

### Merchant Value

- Potential missed opportunities identified
- Product demand insights
- Frequently requested inventory gaps

---

# 31. Product Principles

The product should follow several key principles.

### Simple for Customers

Customers should not need to learn how to use the assistant.

They should simply talk naturally.

### Useful for Merchants

The dashboard should focus on actionable insights rather than overwhelming merchants with raw data.

### Honest Analytics

The platform must clearly distinguish between:

**Actual revenue**

and

**Potential / Expected value influenced by the assistant.**

The product should never imply that a cart addition is a completed sale.

### Helpful Beyond Product Search

The assistant should behave like a store assistant, not simply a search box.

### Focused Shopping Scope

The assistant's commerce responsibilities end at Add to Cart.

---

# 32. Future Opportunities

The initial product focuses on conversational shopping and demand analytics.

Potential future capabilities could include:

- Cross-session customer memory and personalization (the MVP assistant does not retain memory between separate visits/sessions)
- Personalized recommendations
- More advanced product comparisons
- Automated inventory recommendations
- Demand forecasting
- Product gap recommendations
- Merchant alerts for high-demand unavailable products
- Customer segmentation
- More advanced shopping behavior insights
- Support for additional e-commerce platforms

These capabilities are considered future opportunities and are not required for the initial product release.

---

# 33. MVP Scope

The first version should focus on the core value proposition.

### Customer Side

- AI assistant inside the store
- Natural language conversations, including Gulf/Saudi dialect support
- Product discovery
- Product recommendations
- Product questions
- Add to Cart from conversation, with real-time stock/price verification (hybrid catalog sync)
- General helpful responses within the shopping scope (see 13.1 Scope Boundary)
- Escalation to human support when the assistant cannot help

### Merchant Side

- Merchant dashboard
- Conversation metrics
- Product interaction metrics
- Products added to cart
- Potential Cart Value
- Actual Conversion Rate and Realized Value (via order webhook integration)
- Most requested products
- Unavailable product/variant demand
- Potential Lost Opportunities
- Demand insights over time

---

# 34. Final Product Vision

The product aims to transform the traditional online store experience from:

> **"Search for what you want."**

into:

> **"Tell the store what you want."**

At the same time, it transforms every conversational interaction into a source of valuable merchant intelligence.

The ultimate goal is to create a system where:

**Customers get a faster and more natural shopping experience, while merchants gain a clearer understanding of what their customers actually want.**
