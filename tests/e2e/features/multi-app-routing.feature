@REQ-AUTH-01 @REQ-AUTH-02 @REQ-AUTH-13 @multi-app
Feature: Multi-App Routing and Access Control
  As a user with different roles
  I want to access applications based on my permissions
  So that I can use the appropriate dashboards safely

  Background:
    Given I am on the login page

  @REQ-AUTH-01 @REQ-AUTH-13
  Scenario: Admin can navigate freely between all apps
    Given I am logged in as an admin
    When I navigate to "/dashboard/planning"
    Then I should see "Planning"
    When I navigate to "/dashboard/admin"
    Then I should see "Platform Admin Console"
    When I navigate to "/dashboard/events"
    Then I should see "Events"
    When I navigate to "/dashboard/members"
    Then I should see "Members"
    When I navigate to "/dashboard/multi"
    Then I should see "Multi-Section Viewer"

  @REQ-AUTH-02
  Scenario: Standard viewer can access expedition and multi apps
    Given I am logged in as a standard viewer
    When I navigate to "/dashboard/events"
    Then I should see "Events"
    When I navigate to "/dashboard/multi"
    Then I should see "Multi-Section Viewer"

  @REQ-AUTH-02
  Scenario: Standard viewer is blocked from platform admin routes
    Given I am logged in as a standard viewer
    When I navigate to "/dashboard/admin"
    Then I should see "Forbidden"
    When I navigate to "/dashboard/api-browser"
    Then I should see "Forbidden"
    When I navigate to "/dashboard/debug/oauth"
    Then I should see "Forbidden"

  @REQ-AUTH-02
  Scenario: Standard viewer is blocked from planning routes
    Given I am logged in as a standard viewer
    When I navigate to "/dashboard/planning"
    Then I should be on "/dashboard"
    And I should not see "Planning"

  @REQ-AUTH-01 @REQ-AUTH-13
  Scenario: Admin default landing is planning app
    Given I am logged in as an admin
    Then I should be on "/dashboard/planning"
    And I should see "Planning"

  @REQ-AUTH-02 @REQ-AUTH-13
  Scenario: Standard viewer default landing is expedition app
    Given I am logged in as a standard viewer
    Then I should be on "/dashboard"
    And I should see "Events"

  @REQ-AUTH-01
  Scenario: Multi app shows section selector
    Given I am logged in as an admin
    When I navigate to "/dashboard/multi"
    Then I should see "Multi-Section Viewer"
    When I navigate to "/dashboard/members"
    Then I should see "Select Your Section"

  @REQ-AUTH-01
  Scenario: App-specific 404 pages show appropriate navigation
    Given I am logged in as an admin
    When I navigate to "/dashboard/planning/nonexistent"
    Then I should see "Page Not Found"
    And I should see "View Planning Dashboard"
    When I navigate to "/dashboard/events/nonexistent"
    Then I should see "Page Not Found"
    And I should see "View Events"
