@REQ-ADMIN-02 @REQ-ADMIN-03 @skip
Feature: Members List
  # Skipped: /dashboard/members belongs to the "multi" app which has no dedicated login card.
  # This feature requires cross-app navigation support or a dedicated multi-app login flow.
  As an administrator
  I need to view a members list for the selected section
  So that I can review member information and data quality

  Background:
    Given I am logged in with mock persona "seeeFullElevatedOther" for app "Expedition Planner"

  @REQ-ADMIN-02
  Scenario: Members page loads and renders member list content
    When I navigate to "/dashboard/members"
    Then I should see "Members"
    And the members list should render appropriately for this viewport
