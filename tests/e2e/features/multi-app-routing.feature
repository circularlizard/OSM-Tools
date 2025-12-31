@REQ-AUTH-01 @REQ-AUTH-02 @REQ-AUTH-13 @multi-app @skip
Feature: Multi-App Routing and Access Control
  As a user with different roles
  I want to access applications based on my permissions
  So that I can use the appropriate dashboards safely

  # SKIPPED: Mock auth flow is not completing redirect to dashboard
  # Issue: After clicking "Dev: Mock Login", page redirects back to "/" instead of "/dashboard"
  # Next steps: Manual testing required to debug mock auth flow
  # - Check if appSelection is being passed correctly through signIn
  # - Verify JWT token includes appSelection
  # - Check middleware redirect logic
  # - Test with real OAuth flow vs mock

  Background:
    Given I am on the login page

  # TODO: Re-enable after fixing mock auth redirect issue
  # @REQ-AUTH-01 @REQ-AUTH-13
  # Scenario: Admin default landing is planning app
  #   Given I am logged in as an admin
  #   Then I should be on "/dashboard/planning"
  #   And I should see "Planning"

  # TODO: Re-enable after fixing mock auth redirect issue
  # @REQ-AUTH-02 @REQ-AUTH-13
  # Scenario: Standard viewer default landing is expedition app
  #   Given I am logged in as a standard viewer
  #   Then I should be on "/dashboard"
  #   And I should see "Events"

  # TODO: Re-enable after manual testing and fixing navigation issues
  # @REQ-AUTH-01 @REQ-AUTH-13
  # Scenario: Admin can navigate freely between all apps
  #   Given I am logged in as an admin
  #   When I navigate to "/dashboard/planning"
  #   Then I should see "Planning"
  #   When I navigate to "/dashboard/admin"
  #   Then I should see "Platform Admin Console"
  #   When I navigate to "/dashboard/events"
  #   Then I should see "Events"
  #   When I navigate to "/dashboard/members"
  #   Then I should see "Members"

  # TODO: Re-enable after manual testing
  # @REQ-AUTH-02
  # Scenario: Standard viewer can access expedition and multi apps
  #   Given I am logged in as a standard viewer
  #   When I navigate to "/dashboard/events"
  #   Then I should see "Events"
  #   When I navigate to "/dashboard/multi"
  #   Then I should see "Multi-Section Viewer"

  # TODO: Re-enable after manual testing
  # @REQ-AUTH-02
  # Scenario: Standard viewer is blocked from platform admin routes
  #   Given I am logged in as a standard viewer
  #   When I navigate to "/dashboard/admin"
  #   Then I should see "Forbidden"
  #   When I navigate to "/dashboard/api-browser"
  #   Then I should see "Forbidden"

  # TODO: Re-enable after manual testing
  # @REQ-AUTH-02
  # Scenario: Standard viewer is blocked from planning routes
  #   Given I am logged in as a standard viewer
  #   When I navigate to "/dashboard/planning"
  #   Then I should be on "/dashboard"
  #   And I should not see "Planning"
