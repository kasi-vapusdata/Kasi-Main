Feature: FK Claims
@claim
Scenario: Verify user can access Financial Command Center
    Given user opens the VapusData application
    And user clicks login
    When user enter username
    And user enter password
    And user clicks login button
    Then user clicks on "Applications"
    And user clicks on "Go To App"
    And user click on Profile Icon
    Then Enter the domain name in the search box "dmn-79b6b323-1cb1-4272-9818-18b6b4615801"
    


