Feature: Mezon Homepage Navigation
  As a user visiting Mezon website
  I want to verify that all essential homepage elements are present
  So that I can confirm the homepage loads correctly

  Background:
    Given I am on "HomePage"

  @homepage @smoke
  Scenario: Verify all 8 essential homepage elements are present
    Then I should see the main navigation menu
    And I should see "Home" link
    And I should see "Features" link
    And I should see "Developers" link
    And I should see "Login" button
    And I should see the hero section
    And I should see the features section
    And I should see the footer section
