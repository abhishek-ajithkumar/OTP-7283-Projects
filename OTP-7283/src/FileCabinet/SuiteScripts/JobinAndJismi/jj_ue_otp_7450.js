/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
/**********************************************************************************
 * OTP-7450 : Identify change in address
 *
 *
 * ********************************************************************************
 *
 * ********************
 * company name
 *
 * Author: Jobin and Jismi IT Services
 *
 *
 * Date Created: 03-July-2024
 *
 * Description: This script is to check a custom checkbox only if there is a change in the existing Address or new Address is added to the Customer Record.
 *
 *
 * REVISION HISTORY
 *
 * @version 1.0 company name: 03-July-2024: Created the initial build by JJ0347
 *
 *
 *
 **************/
define(['N/record'],
    /**
 * @param{record} record
 */
    (record) => {
        /**
         * Defines the function definition that is executed before record is loaded.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @param {Form} scriptContext.form - Current form
         * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
         * @since 2015.2
         */
        const beforeLoad = (scriptContext) => {

        }

        /**
         * Defines the function definition that is executed before record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const beforeSubmit = (scriptContext) => {

             try {
                if (scriptContext.type !== scriptContext.UserEventType.EDIT) {
                    return;
                }
                else {
 
                    let newRecord = scriptContext.newRecord;
                    let oldRecord = scriptContext.oldRecord;
 
 
                    if (addressChanged(newRecord, oldRecord)) {
                        newRecord.setValue({ fieldId: 'custentity_jj_address_changed', value: true });
                    } 
                    else {
                        newRecord.setValue({ fieldId: 'custentity_jj_address_changed', value: false });
                    }
                }
 
            } catch (e) {
                log.error({
                    title: 'Error occured',
                    details: e.toString()
                });
            }

        }

        /**
         * Defines the function definition that is executed after record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const afterSubmit = (scriptContext) => {

        }

         /** The function addressChanged is used for checking any the address change occured in the customer record or not */
         function addressChanged(newRecord, oldRecord) {
            try {
                let addressChange = false;
                let newAddressCount = newRecord.getLineCount({ sublistId: 'addressbook' });
                let oldAddressCount = oldRecord ? oldRecord.getLineCount({ sublistId: 'addressbook' }) : 0;
                if (newAddressCount !== oldAddressCount) {
                    addressChange = true;
                }
                else {
                    for (let i = 0; i < newAddressCount; i++) {
                        let fields = newRecord.getSublistFields({ sublistId: 'addressbook', line: i });
                        for (let j = 0; j < fields.length; j++) {
                            let fieldId = fields[j];
                            let newValue = newRecord.getSublistValue({ sublistId: 'addressbook', fieldId: fieldId, line: i });
                            let oldValue = oldRecord.getSublistValue({ sublistId: 'addressbook', fieldId: fieldId, line: i });
                            if (newValue !== oldValue) {
                                addressChange = true;
                                break;
                            }
                        }
                        if (addressChange) {
                            break;
                        }
                    }
                }
                return addressChange;
            } catch (e) {
                log.error({
                    title: 'Error occured in addressChanged function',
                    details: e.toString()
                });
                return false;
            }
        }

        return {beforeLoad, beforeSubmit, afterSubmit}

    });
