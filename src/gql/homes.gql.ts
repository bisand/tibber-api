export const gqlHomes = `
{
    viewer {
        homes {
            id
            timeZone
            appNickname
            appAvatar 
            size
            type
            numberOfResidents
            primaryHeatingSource
            hasVentilationSystem
            mainFuseSize
            address {
                address1
                address2
                address3
                postalCode
                city
                country
                latitude
                longitude
            }
            owner {
                id
                firstName
                isCompany
                name
                middleName
                lastName
                organizationNo
                language
                contactInfo {
                    email
                    mobile
                }
                address {
                    address1
                    address2
                    address3
                    city
                    postalCode
                    country
                    latitude
                    longitude
                }
            }
            meteringPointData {
                consumptionEan
                gridCompany
                gridAreaCode
                priceAreaCode
                productionEan
                energyTaxType
                vatType
                estimatedAnnualConsumption
            }
            features {
                realTimeConsumptionEnabled
            }
        }
    }
}
`;

export const gqlHomesComplete = `
{
    viewer {
        homes {
            id
            timeZone
            appNickname
            appAvatar 
            size
            type
            numberOfResidents
            primaryHeatingSource
            hasVentilationSystem
            mainFuseSize
            address {
                address1
                address2
                address3
                postalCode
                city
                country
                latitude
                longitude
            }
            owner {
                id
                firstName
                isCompany
                name
                middleName
                lastName
                organizationNo
                language
                contactInfo {
                    email
                    mobile
                }
                address {
                    address1
                    address2
                    address3
                    city
                    postalCode
                    country
                    latitude
                    longitude
                }
            }
            meteringPointData {
                consumptionEan
                gridCompany
                gridAreaCode
                priceAreaCode
                productionEan
                energyTaxType
                vatType
                estimatedAnnualConsumption
            }
            currentSubscription {
                id
                subscriber {
                    id
                    firstName
                    isCompany
                    name
                    middleName
                    lastName
                    organizationNo
                    language
                    contactInfo {
                        email
                        mobile
                    }
                    address {
                        address1
                        address2
                        address3
                        city
                        postalCode
                        country
                        latitude
                        longitude
                    }
                }
                validFrom
                validTo
                status
                priceInfo {
                    current {
                        total
                        energy
                        tax
                        startsAt
                        level
                        currency
                    }
                    today {
                        total
                        energy
                        tax
                        startsAt
                        level
                        currency
                    }
                    tomorrow {
                        total
                        energy
                        tax
                        startsAt
                        level
                        currency
                    }
                }
            }
            subscriptions {
                id
                subscriber {
                    id
                }
                validFrom
                validTo
                status
                priceInfo {
                    current {
                        total
                        energy
                        tax
                        startsAt
                        level
                        currency
                    }
                    today {
                        total
                        energy
                        tax
                        startsAt
                        level
                        currency
                    }
                    tomorrow {
                        total
                        energy
                        tax
                        startsAt
                        level
                        currency
                    }
                }
            }
            features {
                realTimeConsumptionEnabled
            }
        }
    }
}
`;
