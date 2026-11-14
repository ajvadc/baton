# Student Club Events App: Engineering Sync Notes

## Sync: 18 September 2026
**Attendees**: Alex Rivera (Backend Lead), Priya Sharma (Tech Lead), Maya Lin (Frontend Lead), Rohan Patel (DevOps)

### Discussion Items:
1. **Authentication Alignment**:
   - Alex and Maya confirmed that Firebase Auth integration is functioning well in staging.
   - Decided officially to lock Firebase Auth and eliminate the custom auth service from the backlog.
2. **Upcoming Release Milestones**:
   - Alpha release: 15 October 2026
   - College Fest Ticket Sales Drop: 20 November 2026
3. **Action Items**:
   - Alex to finalize ticket reservation lock in Redis.
   - Priya to review backend API documentation.

## Sync: 28 October 2026
**Attendees**: Alex Rivera, Priya Sharma, Rohan Patel

### Discussion Items:
1. **Payment Gateway Renewal & Vendor Contact**:
   - The Razorpay/Stripe subscription agreement renewal is due by November 30.
   - Meeting debate: Rohan mentioned that Alex handled the vendor verification, but Alex mentioned Rohan should handle all procurement invoices since Rohan holds the club treasurer mandate.
   - **Resolution Status**: Unresolved! Rohan and Alex both noted they assumed the other owned the payment gateway account and renewal.
2. **Recurring Issue: Redis Seat Reservation Lock**:
   - When 500+ users hit the ticket checkout simultaneously, Redis locks expire prematurely after 60 seconds if payment provider webhook takes 75 seconds.
   - Workaround: Manually restart worker queue or increase `LOCK_EXPIRY_SECONDS` to 180 seconds.
