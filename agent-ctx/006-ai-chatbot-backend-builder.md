# Task 6: AI Chatbot Backend Builder

## Task
Build AI customer support chatbot API route at `/src/app/api/chat/route.ts`

## Work Completed

### File Created
- `/home/z/my-project/src/app/api/chat/route.ts` - Complete AI chatbot API route

### Implementation Details

1. **LLM Integration**: Uses `z-ai-web-dev-sdk` with singleton pattern to avoid re-creating instances
2. **Product Search**: Searches database via Prisma using multi-term matching on name, description, and slug fields
3. **System Prompt**: Comprehensive prompt covering:
   - Business info (Streaming Hub, Bangladesh-based digital subscription store)
   - All 11 product categories with examples
   - Payment info (bKash: 01647236359, Nagad: 01647236359)
   - WhatsApp: +8801647236359
   - Delivery: 5-20 minutes
   - Order process steps
   - Price formatting rules (BDT with RMB equivalent)
   - Professional behavior rules
4. **WhatsApp URL Generation**: Auto-generates when order keywords detected
   - Extracts customer name, WhatsApp number, product name from conversation
   - Builds pre-filled WhatsApp message with order details
5. **Conversation History**: Supports last 10 messages for context
6. **Error Handling**: Graceful fallback with WhatsApp contact on LLM failures

### API Contract
- **POST** `/api/chat`
- **Request**: `{ message: string, sessionId: string, history: Array<{role: string, content: string}> }`
- **Response**: `{ response: string, whatsappUrl?: string }`

### Test Results
- Greeting: ✅ Returns friendly welcome with business overview
- Product search (Netflix): ✅ Finds product, shows prices with BDT/RMB
- Product search (ChatGPT Plus): ✅ Correct pricing from database
- Full order with details: ✅ Extracts name, WhatsApp, product, generates WhatsApp URL
- Lint check: ✅ Passes clean

## Dependencies
- `z-ai-web-dev-sdk` (already installed)
- `@/lib/db` (Prisma client, already configured)
- Database with 129 products across 11 categories (already seeded)
