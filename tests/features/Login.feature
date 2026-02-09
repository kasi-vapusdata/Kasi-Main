Feature: VapusData Login

  Scenario Outline: Login with different credential combinations
    Given user opens the VapusData application
    And user clicks login
    When user enters username "<username>"
    And user enters password "<password>"
    And user clicks login button
    Then "<outcome>" should be displayed

    Examples:
      | username           | password        | outcome                |
      | kasi@vapusdata.com | sarasWathi@123  | Finance Command Center |
      | kasi@vapusdata.com | Wrong@123       | login error message    |
      |                    |                 | validation messages    |

@google
Scenario: Login using Continue with Google by valid email
  Given user opens the VapusData application
  And user clicks login
  When user clicks on Continue with Google button
  When user enter email or phone "kasi@vapusdata.com"
  When user clicks on next button
  And user enter signin password "sarasWathi@123"
  When user clicks on next button
  Then "Finance Command Center" should be displayed

Scenario: Login using Continue with Google by invalid password
  Given user opens the VapusData application
  And user clicks login
  When user clicks on Continue with Google button
  When user enter email or phone "kasi@vapusdata.com"
  When user clicks on next button
  And user enter signin password "12345654"
  When user clicks on next button
  Then "Wrong password" should be display

Scenario: Login using Continue with Google by empty field
  Given user opens the VapusData application
  And user clicks login
  When user clicks on Continue with Google button
  When user enter email or phone ""
  When user clicks on next button
  Then "Enter an email or phone number" should be display


