-- Clean up old test data
DELETE FROM Applications WHERE JobID IN (
  SELECT JobID FROM Jobs WHERE CompanyID = (
    SELECT CompanyID FROM Companies WHERE userId = (
      SELECT id FROM Users WHERE email = 'test.company@example.com'
    )
  )
)

DELETE FROM Jobs WHERE CompanyID = (
  SELECT CompanyID FROM Companies WHERE userId = (
    SELECT id FROM Users WHERE email = 'test.company@example.com'
  )
)

DELETE FROM Companies WHERE userId IN (
  SELECT id FROM Users WHERE email = 'test.company@example.com'
)

DELETE FROM Candidates WHERE userId IN (
  SELECT id FROM Users WHERE email LIKE 'test.candidate%@example.com'
)

DELETE FROM Users WHERE email = 'test.company@example.com' OR email LIKE 'test.candidate%@example.com'
