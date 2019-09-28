import { IAddress } from "./IAddress";
import { IContactInfo } from "./IContactInfo";
export interface ILegalEntity {
    id: string;
    firstName: string;
    isCompany: boolean;
    name: string;
    middleName: string;
    lastName: string;
    organizationNo: string;
    language: string;
    contactInfo: IContactInfo;
    address: IAddress;
}
