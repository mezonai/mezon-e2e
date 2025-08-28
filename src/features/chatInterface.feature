Feature: Chat Interface Search Input
  As a logged-in user
  I want to verify that the search input "Find or start a conversation" exists
  So that I can search for conversations after authentication

  Background:
    Given I am authenticated with valid session

  Scenario: Verify "Find or start a conversation" input exists
    Given I navigate to the chat page after authentication 
    When I wait for the chat interface to load completely
    Then the "Find or start a conversation" input should be present
