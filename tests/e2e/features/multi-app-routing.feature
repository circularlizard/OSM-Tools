@REQ-AUTH-01 @REQ-AUTH-02 @multi-app
Feature: Multi-App Routing and Access Control
  As a user with different roles
  I want to access different applications based on my permissions
  So that I can use the appropriate tools for my role

  Background:
    Given Redis is running
    And the application is started

  @REQ-AUTH-01
  Scenario: Admin user can access all apps
    Given I am logged in as an "admin" user
    When I select the "planning" app
    Then I should be redirected to "/dashboard/planning"
    When I navigate to "/dashboard/admin"
    Then I should see the "Platform Admin Console"
    When I navigate to "/dashboard/events"
    Then I should see the "Events" page
    When I navigate to "/dashboard/members"
    Then I should see the "Members" page

  @REQ-AUTH-02
  Scenario: Standard user can access expedition and multi apps
    Given I am logged in as a "standard" user
    When I select the "expedition" app
    Then I should be redirected to "/dashboard"
    When I navigate to "/dashboard/events"
    Then I should see the "Events" page
    When I navigate to "/dashboard/multi"
    Then I should see the "Multi-Section Viewer"

  @REQ-AUTH-02
  Scenario: Standard user cannot access admin routes
    Given I am logged in as a "standard" user
    When I select the "expedition" app
    And I attempt to navigate to "/dashboard/admin"
    Then I should be redirected away from admin routes
    When I attempt to navigate to "/dashboard/members"
    Then I should be redirected away from admin routes

  @REQ-AUTH-01
  Scenario: App selection persists through OAuth flow
    Given I am on the login page
    When I select "admin" role
    And I select "planning" app
    And I sign in with OSM
    Then I should be redirected to "/dashboard/planning"
    And my session should have "planning" as the current app

  @REQ-AUTH-01
  Scenario: Default app assigned by role
    Given I am on the login page
    When I select "admin" role
    And I sign in with OSM without selecting an app
    Then I should be redirected to "/dashboard/planning"
    When I sign out
    And I select "standard" role
    And I sign in with OSM without selecting an app
    Then I should be redirected to "/dashboard"

  @REQ-AUTH-02
  Scenario: Cross-app navigation blocked
    Given I am logged in as a "standard" user with "expedition" app
    When I attempt to navigate to "/dashboard/planning"
    Then I should be blocked or redirected
    When I attempt to navigate to "/dashboard/admin"
    Then I should be blocked or redirected

  @REQ-AUTH-01
  Scenario: App switching requires re-authentication
    Given I am logged in as an "admin" user with "planning" app
    When I want to switch to "platform-admin" app
    Then I should go through the login flow again
    And I should be able to select "platform-admin"
    And I should be redirected to "/dashboard/admin"

  @REQ-AUTH-01 @REQ-AUTH-02
  Scenario Outline: Role and app combinations
    Given I am logged in as a "<role>" user
    When I select the "<app>" app
    Then I should be able to access "<app>" routes
    And I should see the "<expected_page>" page

    Examples:
      | role     | app            | expected_page              |
      | admin    | planning       | Planning                   |
      | admin    | platform-admin | Platform Admin Console     |
      | admin    | expedition     | Events                     |
      | admin    | multi          | Multi-Section Viewer       |
      | standard | expedition     | Events                     |
      | standard | multi          | Multi-Section Viewer       |

  @REQ-AUTH-02
  Scenario: Multi-section viewer allows section switching
    Given I am logged in as an "admin" user with "multi" app
    When I navigate to "/dashboard/members"
    Then I should see the section selector
    When I change to a different section
    Then the data should update for the new section
    And I should remain in the "multi" app

  @REQ-AUTH-01
  Scenario: Platform admin routes require admin role
    Given I am logged in as a "standard" user
    When I attempt to navigate to "/dashboard/admin"
    Then I should see a "Forbidden" or "Not Found" error
    When I attempt to navigate to "/dashboard/api-browser"
    Then I should see a "Forbidden" or "Not Found" error
    When I attempt to navigate to "/dashboard/debug/oauth"
    Then I should see a "Forbidden" or "Not Found" error

  @REQ-AUTH-01
  Scenario: App-specific 404 pages
    Given I am logged in as an "admin" user with "planning" app
    When I navigate to "/dashboard/planning/nonexistent"
    Then I should see the planning app 404 page
    And the 404 page should offer navigation to planning routes
    When I am in the "expedition" app
    And I navigate to "/dashboard/events/nonexistent"
    Then I should see the expedition app 404 page
    And the 404 page should offer navigation to expedition routes
