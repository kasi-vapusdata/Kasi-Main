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
    
@ELEC_RH_PUC_FDC
Scenario: Download the Electronics PUC_FDC RH file and verify data
    Given user clicks on "Claims"
    And  user clicks on "Filters"
    And Select filter "B U" as "ELECTRONICS"
    And Select filter "Category" as "ELECTRONICS"
    And Select filter "Scheme Type" as "SELL SIDE"
    And Select filter "Sub Scheme Type" as "PUC FDC"
    And Select filter "Status" as "PENDING KAM APPROVAL"
    Then user clicks on "Apply Filters"
    And click on the first claim "view Details" in the list
    And click on download "RH file" and verify data

@ELEC_CONFIG_PUC_FDC
Scenario: Download the Electronics PUC_FDC config file and verify data
    Given user clicks on "Claims"
    And  user clicks on "Filters"
    And Select filter "B U" as "ELECTRONICS"
    And Select filter "Category" as "ELECTRONICS"
    And Select filter "Scheme Type" as "SELL SIDE"
    And Select filter "Sub Scheme Type" as "PUC FDC"
    And Select filter "Status" as "PENDING KAM APPROVAL"
    Then user clicks on "Apply Filters"
    And click on the first claim "view Details" in the list
    And click on download Config file and verify data

@ELEC_RH_PREXO
Scenario: Download the Electronics PREXO RH file and verify data
    Given user clicks on "Claims"
    And  user clicks on "Filters"
    And Select filter "B U" as "ELECTRONICS"
    And Select filter "Category" as "ELECTRONICS"
    And Select filter "Scheme Type" as "SELL SIDE"
    And Select filter "Sub Scheme Type" as "PREXO"
    And Select filter "Status" as "PENDING KAM APPROVAL"
    Then user clicks on "Apply Filters"
    And click on the first claim "view Details" in the list
    And click on download "RH file" and verify data

@ELEC_CONFIG_PREXO
Scenario: Download the Electronics PREXO config file and verify data
    Given user clicks on "Claims"
    And  user clicks on "Filters"
    And Select filter "B U" as "ELECTRONICS"
    And Select filter "Category" as "ELECTRONICS"
    And Select filter "Scheme Type" as "SELL SIDE"
    And Select filter "Sub Scheme Type" as "PREXO"
    And Select filter "Status" as "PENDING KAM APPROVAL"
    Then user clicks on "Apply Filters"
    And click on the first claim "view Details" in the list
    And click on download Config file and verify data


@ELEC_RH_BANK_OFFER
Scenario: Download the Electronics BANK OFFER RH file and verify data
    Given user clicks on "Claims"
    And  user clicks on "Filters"
    And Select filter "B U" as "ELECTRONICS"
    And Select filter "Category" as "ELECTRONICS"
    And Select filter "Scheme Type" as "SELL SIDE"
    And Select filter "Sub Scheme Type" as "BANK OFFER"
    And Select filter "Status" as "PENDING KAM APPROVAL"
    Then user clicks on "Apply Filters"
    And click on the first claim "view Details" in the list
    And click on download "RH file" and verify data

@ELEC_CONFIG_BANK_OFFER
Scenario: Download the Electronics BANK OFFER config file and verify data
    Given user clicks on "Claims"
    And  user clicks on "Filters"
    And Select filter "B U" as "ELECTRONICS"
    And Select filter "Category" as "ELECTRONICS"
    And Select filter "Scheme Type" as "SELL SIDE"
    And Select filter "Sub Scheme Type" as "BANK OFFER"
    And Select filter "Status" as "PENDING KAM APPROVAL"
    Then user clicks on "Apply Filters"
    And click on the first claim "view Details" in the list
    And click on download Config file and verify data


@ELEC_RH_COUPON
Scenario: Download the Electronics COUPON RH file and verify data
    Given user clicks on "Claims"
    And  user clicks on "Filters"
    And Select filter "B U" as "ELECTRONICS"
    And Select filter "Category" as "ELECTRONICS"
    And Select filter "Scheme Type" as "SELL SIDE"
    And Select filter "Sub Scheme Type" as "COUPON"
    And Select filter "Status" as "PENDING KAM APPROVAL"
    Then user clicks on "Apply Filters"
    And click on the first claim "view Details" in the list
    And click on download "RH file" and verify data

@ELEC_CONFIG_COUPON
Scenario: Download the Electronics COUPON config file and verify data
    Given user clicks on "Claims"
    And  user clicks on "Filters"
    And Select filter "B U" as "ELECTRONICS"
    And Select filter "Category" as "ELECTRONICS"
    And Select filter "Scheme Type" as "SELL SIDE"
    And Select filter "Sub Scheme Type" as "COUPON"
    And Select filter "Status" as "PENDING KAM APPROVAL"
    Then user clicks on "Apply Filters"
    And click on the first claim "view Details" in the list
    And click on download Config file and verify data

@ELEC_RH_PERIODIC_CLAIM
Scenario: Download the Electronics PERIODIC_CLAIM RH file and verify data
    Given user clicks on "Claims"
    And  user clicks on "Filters"
    And Select filter "B U" as "ELECTRONICS"
    And Select filter "Category" as "ELECTRONICS"
    And Select filter "Scheme Type" as "BUY SIDE"
    And Select filter "Sub Scheme Type" as "PERIODIC_CLAIM"
    And Select filter "Status" as "PENDING KAM APPROVAL"
    Then user clicks on "Apply Filters"
    And click on the first claim "view Details" in the list
    And click on download "RH file" and verify data

@ELEC_CONFIG_PERIODIC_CLAIM
Scenario: Download the Electronics PERIODIC_CLAIM config file and verify data
    Given user clicks on "Claims"
    And  user clicks on "Filters"
    And Select filter "B U" as "ELECTRONICS"
    And Select filter "Category" as "ELECTRONICS"
    And Select filter "Scheme Type" as "SELL SIDE"
    And Select filter "Sub Scheme Type" as "PERIODIC_CLAIM"
    And Select filter "Status" as "PENDING KAM APPROVAL"
    Then user clicks on "Apply Filters"
    And click on the first claim "view Details" in the list
    And click on download Config file and verify data

@ELEC_RH_PDC
Scenario: Download the Electronics PDC RH file and verify data
    Given user clicks on "Claims"
    And  user clicks on "Filters"
    And Select filter "B U" as "ELECTRONICS"
    And Select filter "Category" as "ELECTRONICS"
    And Select filter "Scheme Type" as "PDC"
    And Select filter "Sub Scheme Type" as "PDC"
    And Select filter "Status" as "PENDING KAM APPROVAL"
    Then user clicks on "Apply Filters"
    And click on the first claim "view Details" in the list
    And click on download "RH file" and verify data

@ELEC_CONFIG_PDC
Scenario: Download the Electronics PDC config file and verify data
    Given user clicks on "Claims"
    And  user clicks on "Filters"
    And Select filter "B U" as "ELECTRONICS"
    And Select filter "Category" as "ELECTRONICS"
    And Select filter "Scheme Type" as "SELL SIDE"
    And Select filter "Sub Scheme Type" as "PDC"
    And Select filter "Status" as "PENDING KAM APPROVAL"
    Then user clicks on "Apply Filters"
    And click on the first claim "view Details" in the list
    And click on download Config file and verify data





# Scenario: Download the Electronics PUC_FDC config file and verify data
#     Given user clicks on "Claims"
#     And  user clicks on "Filters"
#     And Select filter "B U" as "ELECTRONICS"
#     And Select filter "Category" as "ELECTRONICS"
#     And Select filter "Scheme Type" as "SELL SIDE"
#     And Select filter "Sub Scheme Type" as "PUC FDC"
#     And Select filter "Status" as "PENDING KAM APPROVAL"
#     Then user clicks on "Apply Filters"
#     And click on the first claim "view Details" in the list
#     And click on download "Config file" and verify data
    
# Scenario: Download the Electronics PREXO config file and verify data
#     Given user clicks on "Claims"
#     And  user clicks on "Filters"
#     And Select filter "B U" as "ELECTRONICS"
#     And Select filter "Category" as "ELECTRONICS"
#     And Select filter "Scheme Type" as "SELL SIDE"
#     And Select filter "Sub Scheme Type" as "PREXO"
#     And Select filter "Status" as "PENDING KAM APPROVAL"
#     Then user clicks on "Apply Filters"
#     And click on the first claim "view Details" in the list
#     And click on download "Config file" and verify data


    



