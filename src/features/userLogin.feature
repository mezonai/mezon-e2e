Feature: User Login to Mezon System
  As a user, I want to login to access Mezon platform

  @user @smoke
  Scenario: Navigate to login page and login
    Given I navigate to "https://dev-mezon.nccsoft.vn/"
    When I click "Login" button
    Then I should be on "LoginPage"

  @user @smoke
  Scenario: Successful login with valid credentials via OTP
    Given I am on "LoginPage"
    When I enter email "mezontest@gmail.com"
    And I click "Send OTP" button
    And I enter OTP "578098"
    Then I should be redirected to homepage

  @user @negative
  Scenario: Failed login with invalid email
    Given I am on "LoginPage"
    When I enter email "invalid@email.com"
    And I click "Send OTP" button
    Then I should see error message "Login too fast"
    And I should remain on "LoginPage"

  @user @negative
  Scenario: Failed login with empty OTP
    Given I am on "LoginPage"
    When I enter email "mezontest@gmail.com"
    And I click "Send OTP" button
    And I leave OTP field empty
    And I click "Verify OTP" button
    Then I should see error message "Invalid OTP"
    And I should remain on "LoginPage"
