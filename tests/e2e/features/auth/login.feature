@REQ-AUTH-01 @REQ-AUTH-02 @REQ-AUTH-03
Feature: Authentication and Login Flow
  As a user of the SEEE Dashboard
  I need to authenticate using OSM OAuth
  So that I can access the dashboard with appropriate permissions

  Background:
    Given I am on the login page

  @REQ-AUTH-02
  Scenario: Unauthenticated user is redirected to login
    When I navigate to "/dashboard"
    Then I should be on "/"
    And I should see "Select an application"

  @REQ-AUTH-03
  Scenario: Admin user logs in via Expedition Planner card
    Given I am logged in with mock persona "seeeFullElevatedOther" for app "Expedition Planner"
    Then I should be on "/dashboard"
    And I should see "Planning"

  @REQ-AUTH-03
  Scenario: Standard user logs in via Expedition Viewer card
    Given I am logged in with mock persona "seeeEventsOnlyRestrictedOther" for app "Expedition Viewer"
    Then I should be on "/dashboard"
    And I should see "Events"

  @REQ-AUTH-12
  Scenario: User can navigate to events after login
    Given I am logged in with mock persona "seeeFullElevatedOther" for app "Expedition Viewer"
    When I navigate to "/dashboard/events"
    Then I should be on "/dashboard/events"
    And I should see "Events"

  @REQ-AUTH-11 @REQ-AUTH-12
  Scenario: Session expiry redirects to login
    Given I am logged in as an admin
    When I navigate to "/dashboard/events"
    And my session expires
    Then I should be on "/"
    And I should see "Select an application"

  @REQ-AUTH-11 @skip
  Scenario: Inactivity triggers a hard logout
    # Skipped: Requires inactivity timeout longer than Playwright test timeout.
    # The inactivity mechanism is tested via unit tests instead.
    Given I am logged in as an admin
    When I navigate to "/dashboard"
    And I wait for inactivity timeout
    Then I should be on "/"
    And I should see "Select an application"
