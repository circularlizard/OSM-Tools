@REQ-AUTH-01 @REQ-AUTH-02 @REQ-AUTH-13 @REQ-AUTH-16 @multi-app
Feature: Multi-App Routing and Access Control
  As a user with different roles
  I want to access applications based on my permissions
  So that I can use the appropriate dashboards safely

  Background:
    Given I am on the login page

  @REQ-AUTH-16
  Scenario: No SEEE access is denied Expedition Viewer
    Given I am logged in with mock persona "noSeeeElevatedOther" for app "Expedition Viewer"
    Then I should see "Permission Required"
    And I should see "events"

  @REQ-AUTH-16
  Scenario: No SEEE access is denied Expedition Planner
    Given I am logged in with mock persona "noSeeeElevatedOther" for app "Expedition Planner"
    Then I should see "Permission Required"
    And I should see "events"

  @REQ-AUTH-16
  Scenario: SEEE events-only user can use Expedition Viewer
    Given I am logged in with mock persona "seeeEventsOnlyRestrictedOther" for app "Expedition Viewer"
    Then I should see "Events"

  @REQ-AUTH-16
  Scenario: SEEE events-only user is denied Expedition Planner
    Given I am logged in with mock persona "seeeEventsOnlyRestrictedOther" for app "Expedition Planner"
    Then I should see "Permission Required"
    And I should see "member"

  @REQ-AUTH-16
  Scenario: SEEE events-only user is denied Data Quality
    Given I am logged in with mock persona "seeeEventsOnlyRestrictedOther" for app "OSM Data Quality"
    Then I should see "Permission Required"
    And I should see "member"

  @REQ-AUTH-16
  Scenario: SEEE full + elevated other user can access Data Quality
    Given I am logged in with mock persona "seeeFullElevatedOther" for app "OSM Data Quality"
    Then I should see "Member Data Issues"

  @REQ-AUTH-01
  Scenario: Standard viewer is blocked from platform admin routes
    Given I am logged in with mock persona "seeeEventsOnlyRestrictedOther" for app "Expedition Viewer"
    When I navigate to "/dashboard/admin"
    Then I should be on "/forbidden"
