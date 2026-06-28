#!/bin/bash
BASE="http://localhost:4000/api"

extract() {
  node -pe "const data = JSON.parse(require('fs').readFileSync(0)); $1"
}

echo "=== 1. Login as organizer ==="
ORG_LOGIN=$(curl -s -X POST $BASE/auth/login -H "Content-Type: application/json" \
  -d '{"email":"alex.morgan@eventpro.com","password":"password123"}')
ORG_TOKEN=$(echo "$ORG_LOGIN" | extract "data.data.token")
echo "ok, token len: ${#ORG_TOKEN}"

echo ""
echo "=== 2. Sign up a fresh attendee ==="
RAND=$RANDOM
ATT_LOGIN=$(curl -s -X POST $BASE/auth/signup -H "Content-Type: application/json" \
  -d "{\"email\":\"testattendee$RAND@example.com\",\"password\":\"password123\",\"firstName\":\"Test\",\"lastName\":\"Attendee\"}")
ATT_TOKEN=$(echo "$ATT_LOGIN" | extract "data.data.token")
ATT_ID=$(echo "$ATT_LOGIN" | extract "data.data.user.id")
echo "ok, attendee id: $ATT_ID"

echo ""
echo "=== 3. GET /events (discovery, public-ish) ==="
curl -s "$BASE/events" -H "Authorization: Bearer $ATT_TOKEN" | extract "data.data.map(e=>({id:e.id,title:e.title,registeredCount:e.registeredCount,capacityStatus:e.capacityStatus}))"

echo ""
echo "=== 4. Get the AI Summit event id ==="
EVENTS=$(curl -s "$BASE/events" -H "Authorization: Bearer $ATT_TOKEN")
EVENT_ID=$(echo "$EVENTS" | extract "data.data.find(e=>e.title.includes('AI Summit')).id")
echo "AI Summit id: $EVENT_ID"

echo ""
echo "=== 5. GET /events/:id (detail page) ==="
curl -s "$BASE/events/$EVENT_ID" -H "Authorization: Bearer $ATT_TOKEN" | extract "(function(d){return JSON.stringify({title:d.title, speakers:d.speakers.length, agenda:d.agenda.length, ticketTypes:d.ticketTypes.length})})(data.data)"

echo ""
echo "=== 6. List ticket types for event ==="
TICKETS=$(curl -s "$BASE/tickets/event/$EVENT_ID")
echo "$TICKETS" | extract "data.data.map(t=>({id:t.id,name:t.name,price:t.price,sold:t.sold,quantity:t.quantity}))"
GENERAL_TICKET_ID=$(echo "$TICKETS" | extract "data.data.find(t=>t.name==='General').id")

echo ""
echo "=== 7. Attendee registers for event (General ticket) ==="
REG=$(curl -s -X POST $BASE/registrations -H "Authorization: Bearer $ATT_TOKEN" -H "Content-Type: application/json" \
  -d "{\"eventId\":\"$EVENT_ID\",\"ticketTypeId\":\"$GENERAL_TICKET_ID\"}")
echo "$REG" | node -pe "JSON.stringify(JSON.parse(require('fs').readFileSync(0)), null, 2)"
REG_ID=$(echo "$REG" | extract "data.data.id")
REG_STATUS=$(echo "$REG" | extract "data.data.status")
QR_CODE=$(echo "$REG" | extract "data.data.qrCode")
echo "Registration id: $REG_ID, status: $REG_STATUS"

echo ""
echo "=== 8. Organizer approves the pending registration ==="
curl -s -X PATCH "$BASE/registrations/$REG_ID/approve" -H "Authorization: Bearer $ORG_TOKEN" | extract "JSON.stringify({status: data.data.status})"

echo ""
echo "=== 9. Organizer checks in attendee via QR ==="
curl -s -X POST "$BASE/checkins" -H "Authorization: Bearer $ORG_TOKEN" -H "Content-Type: application/json" \
  -d "{\"qrCode\":\"$QR_CODE\"}" | extract "JSON.stringify(data)"

echo ""
echo "=== 10. Duplicate check-in should fail ==="
curl -s -X POST "$BASE/checkins" -H "Authorization: Bearer $ORG_TOKEN" -H "Content-Type: application/json" \
  -d "{\"qrCode\":\"$QR_CODE\"}" | extract "JSON.stringify(data)"

echo ""
echo "=== 11. Attendance stats for event ==="
curl -s "$BASE/checkins/event/$EVENT_ID/stats" -H "Authorization: Bearer $ORG_TOKEN" | extract "JSON.stringify(data.data)"

echo ""
echo "=== 12. Certificate templates ==="
curl -s "$BASE/certificates/templates" | extract "JSON.stringify(data.data)"

echo ""
echo "=== 13. Certificate preview (variable substitution) ==="
curl -s -X POST "$BASE/certificates/preview" -H "Authorization: Bearer $ORG_TOKEN" -H "Content-Type: application/json" \
  -d "{\"registrationId\":\"$REG_ID\",\"trackName\":\"Generative AI Strategies\"}" | extract "JSON.stringify(data.data)"

echo ""
echo "=== 14. Bulk certificate generation ==="
curl -s -X POST "$BASE/certificates/generate-batch" -H "Authorization: Bearer $ORG_TOKEN" -H "Content-Type: application/json" \
  -d "{\"eventId\":\"$EVENT_ID\",\"templateId\":\"tpl_elite_platinum\",\"deliveryModes\":{\"emailAttendee\":true}}" | extract "JSON.stringify({issuedCount: data.data.issuedCount})"

echo ""
echo "=== 15. Organizer dashboard summary ==="
curl -s "$BASE/analytics/dashboard" -H "Authorization: Bearer $ORG_TOKEN" | extract "JSON.stringify(data.data)"

echo ""
echo "=== 16. Registration trends (7-day chart) ==="
curl -s "$BASE/analytics/registration-trends?days=7" -H "Authorization: Bearer $ORG_TOKEN" | extract "JSON.stringify(data.data)"

echo ""
echo "=== 17. Revenue by segment ==="
curl -s "$BASE/analytics/revenue-by-segment" -H "Authorization: Bearer $ORG_TOKEN" | extract "JSON.stringify(data.data)"

echo ""
echo "=== 18. Capacity thresholds ==="
curl -s "$BASE/analytics/capacity-thresholds" -H "Authorization: Bearer $ORG_TOKEN" | extract "JSON.stringify(data.data)"

echo ""
echo "=== 19. Attendee's 'My Events' / registered events list ==="
curl -s "$BASE/registrations/me" -H "Authorization: Bearer $ATT_TOKEN" | extract "JSON.stringify(data.data.map(r=>({event:r.event.title,status:r.status,checkedIn:r.checkedIn})))"

echo ""
echo "=== 20. Create a brand new event end-to-end (organizer) ==="
NEW_EVT=$(curl -s -X POST "$BASE/events" -H "Authorization: Bearer $ORG_TOKEN" -H "Content-Type: application/json" \
  -d '{"title":"Test Created Event","category":"Music","capacity":100,"price":50,"startDate":"2025-03-01"}')
echo "$NEW_EVT" | extract "JSON.stringify({id:data.data.id, title:data.data.title, status:data.data.status})"
NEW_EVT_ID=$(echo "$NEW_EVT" | extract "data.data.id")

echo ""
echo "=== 21. Update the new event (e.g. wizard step 2/3) ==="
curl -s -X PATCH "$BASE/events/$NEW_EVT_ID" -H "Authorization: Bearer $ORG_TOKEN" -H "Content-Type: application/json" \
  -d '{"status":"scheduled","capacity":150}' | extract "JSON.stringify({status:data.data.status, capacity:data.data.capacity})"

echo ""
echo "=== 22. Event Directory summary (stat cards) ==="
curl -s "$BASE/events/directory/summary" -H "Authorization: Bearer $ORG_TOKEN" | extract "JSON.stringify(data.data)"

echo ""
echo "=== 23. Validation error check (missing email) ==="
curl -s -X POST "$BASE/auth/signup" -H "Content-Type: application/json" -d '{"password":"password123"}' | extract "JSON.stringify(data)"

echo ""
echo "=== 24. Auth failure check (wrong password) ==="
curl -s -X POST "$BASE/auth/login" -H "Content-Type: application/json" -d '{"email":"alex.morgan@eventpro.com","password":"wrongpass"}' | extract "JSON.stringify(data)"

echo ""
echo "=== 25. Unauthorized access check (attendee tries organizer route) ==="
curl -s -X POST "$BASE/events" -H "Authorization: Bearer $ATT_TOKEN" -H "Content-Type: application/json" -d '{"title":"Should fail"}' | extract "JSON.stringify(data)"

echo ""
echo "=== ALL TESTS COMPLETED ==="
