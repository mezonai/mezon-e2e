Feature: Simple Login Test

  @user
  Scenario: Basic login
    Given I navigate to login page
    When I fill in credentials
    Then I should be logged in
