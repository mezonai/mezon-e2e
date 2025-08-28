Feature: Clan Sticker Modal ESC Key Behavior

  Background:
    Given I am authenticated with valid session
    And I am on the clan settings page

  @modal @sticker @esc-key
  Scenario: ESC key should close modals one by one, not all at once
    Given I navigate to the clan sticker settings
    When I click on "Image Stickers" section
    And I click on "Upload Stickers" button
    Then the upload modal should be displayed
    When I press the ESC key once
    Then only the top modal should be closed
    And the underlying modal should remain open
    When I press the ESC key again
    Then the next modal should be closed
    And I should return to the previous interface level

  @modal @sticker @accessibility
  Scenario: Modal navigation with keyboard accessibility
    Given I navigate to the clan sticker settings
    When I open the sticker upload modal
    Then the modal should be focusable
    And the ESC key should provide proper navigation
    And the focus should return to the triggering element after modal closes

  @regression @modal-stack
  Scenario: Multiple nested modals behavior
    Given I have multiple modals open in the interface
    When I press ESC key multiple times
    Then each ESC press should close only the topmost modal
    And the modal stack should be maintained properly
    And all modals should eventually be closed one by one
