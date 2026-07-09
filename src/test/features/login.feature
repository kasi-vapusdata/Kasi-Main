Feature: VapusData Login
@loginOne
  Scenario Outline: Login with different credential combinations
    Given user opens the VapusData application
    And user clicks login
    When user enters username "<username>"
    And user enters password "<password>"
    And user clicks login button
    Then "<outcome>" should be displayed

    Examples:
      | username           | password        | outcome                |
      | kasi@vapusdata.com | sarasWathi@123  | VapusFin               |
      | kasi@vapusdata.com | Wrong@123       | login error message    |
      |                    |                 | validation messages    |
@google
Scenario: Login using Continue with Google by valid email
  Given user opens the VapusData application
  And user clicks login
  When user clicks on Continue with Google button
  When user enters username "kasi@vapusdata.com"
  When user clicks on next buttonnpx cucumber-js src/test/features/login.feature --require-module ts-node/register --require src/test/steps/**/*.ts --require src/hooks/hooks.ts
  And user enter password "sarasWathi@123"
  When user clicks on next button
  Then "VapusFin" should be displayed

Scenario: Login using Continue with Google by invalid password
  Given user opens the VapusData application
  And user clicks login
  When user clicks on Continue with Google button
  When user enters username "kasi@vapusdata.com"
  When user clicks on next button
  And user enter password "12345654"
  When user clicks on next button
  Then "Wrong password" should be displayed

Scenario: Login using Continue with Google by empty field
  Given user opens the VapusData application
  And user clicks login
  When user clicks on Continue with Google button
  When user enters username ""
  When user clicks on next button
  Then "Enter an email or phone number" should be displayed

