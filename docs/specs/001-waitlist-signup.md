# 001: Join the waitlist and review signups

|                 |                      |
| --------------- | -------------------- |
| **Status**      | Draft                |
| **Author**      | Techy Tim            |
| **Approved by** | Pending              |
| **Branch / PR** | `docs/waitlist-spec` |

## Problem

Visitors interested in a launch need a way to leave an email address. The owner needs one reliable list without exposing one visitor’s address to another.

## Users

- **Visitor:** join the launch list.
- **Owner:** review signups privately.

## Scope

One public email form with on-page confirmation and one read-only list for the designated owner.

### Out of scope

Confirmation emails, campaigns, referrals, exports, and multiple waitlists.

## Acceptance criteria

### AC1 (P1): Join without an account

- **Given** a signed-out visitor with a valid email address not yet on the list
- **When** they submit it
- **Then** they see confirmation after the signup is saved, without needing to sign in.

### AC2 (P1): Only the owner can read signups

- **Given** a signed-out visitor or a signed-in account other than the designated owner
- **When** they open the admin page or request its data directly
- **Then** no signup data is returned. Neither joining the list nor creating an account confers owner access.

### AC3 (P1): Review signups

- **Given** the designated owner is signed in
- **When** they open the list on a later visit
- **Then** they see every saved address and its first signup time, newest first, or “No signups yet” if the list is empty.

### AC4 (P1): Reject invalid input

- **Given** a blank or malformed address
- **When** a visitor submits it
- **Then** the form asks for a valid email address, and no signup is recorded.

### AC5 (P1): Repeat submissions do not disclose membership

- **Given** an address already on the list
- **When** someone submits it again, including with different letter case or surrounding whitespace
- **Then** they see the same confirmation as for a new address. The owner still sees one entry with its original signup time.

### AC6 (P2): Do not confirm a failed save

- **Given** the service cannot save a new signup
- **When** the visitor submits a valid address
- **Then** they see a retry message rather than confirmation.

## Data changes

Store the email address and first signup time. Each distinct address appears only once. Addresses are personal data: never log submitted addresses or put real subscriber data in the repository. There is no prior list to migrate.

## Access decision

The public form accepts a new email submission without sign-in. It cannot look up, edit, or delete an existing signup. A repeat submission changes nothing and receives the same acknowledgement. Only the signed-in owner can read the list, including through direct data requests.

## Open questions

None.
