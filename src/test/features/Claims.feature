Feature: FK Claims

Background: Verify user can access Financial Command Center
    Given user opens the VapusData application
    And user clicks login
    When user enter username
    And user enter password
    And user clicks login button
    Then user clicks on "Applications"
    And user clicks on "Go To App"
    And user click on Profile Icon
    Then Enter the domain name in the search box "dmn-57eb9fe6-3156-42f9-b013-d9befb4861e1"
    When user clicks on "Finance Menu" 
    When user clicks on "Claims and Offers"
    And user navigates to Claims page from Finance menu
    
@claim
Scenario: Verify user can navigate to Claims page
    Given user clicks on "Claims"
    And  user clicks on "Filters"
    And Select filter "B U" as "ELECTRONICS"
    And Select filter "Category" as "ELECTRONICS"
    And Select filter "Scheme Type" as "SELL SIDE"
    And Select filter "Sub Scheme Type" as "PUC FDC"
    And Select filter "Status" as "PENDING KAM APPROVAL"
    Then user clicks on "Apply Filters"
    And click on the first claim "view Details" in the list
    Then Verify the valid from and valid to dates 



    



