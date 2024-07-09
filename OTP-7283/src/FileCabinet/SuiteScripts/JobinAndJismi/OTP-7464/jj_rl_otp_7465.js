/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 */
/**********************************************************************************
 * OTP-7465 : Create API for the fetching the Sales order details
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
 * Date Created: 04-July-2024
 *
 * Description: This script is to fetch all the open Sales Order details in JSON object if ID is not passed through API parameter, if a valid Sales Order Internal ID is passed through API parameter, it will display the items details in JSON object, and if an invalid internal ID is passed through Params, the API will display “RESULT: NOT FOUND”.
 * REVISION HISTORY
 *
 * @version 1.0 company name: 04-July-2024: Created the initial build by JJ0347
 *
 *
 *
 **************/
define(['N/record', 'N/search'],
    /**
 * @param{record} record
 * @param{search} search
 */
    (record, search) => {
        /**
         * Defines the function that is executed when a GET request is sent to a RESTlet.
         * @param {Object} requestParams - Parameters from HTTP request URL; parameters passed as an Object (for all supported
         *     content types)
         * @returns {string | Object} HTTP response body; returns a string when request Content-Type is 'text/plain'; returns an
         *     Object when request Content-Type is 'application/json' or 'application/xml'
         * @since 2015.2
         */
        const get = (requestParams) => {

            try {
                // Retrieve the sales order ID from the request parameters
                let salesOrderId = requestParams.id;

                // If no sales order ID is provided, perform a search to retrieve multiple sales orders with Open status
                if (!salesOrderId) {
                    let salesOrders = [];
                    let salesOrderSearch = search.create({
                        type: search.Type.SALES_ORDER,
                        filters: [
                            ['status', 'anyof', 'SalesOrd:A', 'SalesOrd:B', 'SalesOrd:D', 'SalesOrd:E', 'SalesOrd:F'],
                            'AND',
                            ['mainline', 'is', 'T']
                        ],
                        columns: ['internalid', 'tranid', 'trandate', 'total']
                    });

                    // Run the search and process each result
                    salesOrderSearch.run().each(function (result) {
                        salesOrders.push({
                            internalId: result.getValue({ name: 'internalid' }),
                            documentNumber: result.getValue({ name: 'tranid' }),
                            date: result.getValue({ name: 'trandate' }),
                            totalAmount: result.getValue({ name: 'total' })
                        });
                        return true;
                    });

                    // Return the list of sales orders
                    return salesOrders;
                }
                else {
                    // Load the specific sales order record if an ID is provided
                    let salesOrder = record.load({
                        type: record.Type.SALES_ORDER,
                        id: salesOrderId,
                        isDynamic: true
                    });
                    let items = [];
                    let lineCount = salesOrder.getLineCount({ sublistId: 'item' });
                    // Loop through each item line in the sales order
                    for (let i = 0; i < lineCount; i++) {
                        items.push({
                            itemName: salesOrder.getSublistText({ sublistId: 'item', fieldId: 'item', line: i }),
                            quantity: salesOrder.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i }),
                            rate: salesOrder.getSublistValue({ sublistId: 'item', fieldId: 'rate', line: i }),
                            grossAmount: salesOrder.getSublistValue({ sublistId: 'item', fieldId: 'amount', line: i })
                        });
                    }
                    // Return the list of items in the sales order
                    return items;
                }
            }
            catch (e) {
                log.error({
                    title: 'Error retrieving sales order',
                    details: e
                });
                // Return a "Not Found" result
                return "RESULT: NOT FOUND";
            }

        }



        /**
         * Defines the function that is executed when a PUT request is sent to a RESTlet.
         * @param {string | Object} requestBody - The HTTP request body; request body are passed as a string when request
         *     Content-Type is 'text/plain' or parsed into an Object when request Content-Type is 'application/json' (in which case
         *     the body must be a valid JSON)
         * @returns {string | Object} HTTP response body; returns a string when request Content-Type is 'text/plain'; returns an
         *     Object when request Content-Type is 'application/json' or 'application/xml'
         * @since 2015.2
         */
        const put = (requestBody) => {

        }

        /**
         * Defines the function that is executed when a POST request is sent to a RESTlet.
         * @param {string | Object} requestBody - The HTTP request body; request body is passed as a string when request
         *     Content-Type is 'text/plain' or parsed into an Object when request Content-Type is 'application/json' (in which case
         *     the body must be a valid JSON)
         * @returns {string | Object} HTTP response body; returns a string when request Content-Type is 'text/plain'; returns an
         *     Object when request Content-Type is 'application/json' or 'application/xml'
         * @since 2015.2
         */
        const post = (requestBody) => {

            try {
                var salesOrderId = requestBody.salesOrderId;
                var itemDetails = requestBody.itemDetails;
    
                if (!salesOrderId) {
                    throw error.create({
                        name: 'MISSING_REQUIRED_FIELDS',
                        message: 'Sales Order ID is required',
                        notifyOff: true
                    });
                }
    
                // Transform the sales order to item fulfillment
                var itemFulfillment = record.transform({
                    fromType: record.Type.SALES_ORDER,
                    fromId: salesOrderId,
                    toType: record.Type.ITEM_FULFILLMENT,
                    isDynamic: true
                });
    
                // Iterate over item details and set item fulfillment lines if provided
                if (itemDetails) {
                    itemDetails.forEach(function(item) {
                        var lineNum = itemFulfillment.findSublistLineWithValue({
                            sublistId: 'item',
                            fieldId: 'item',
                            value: item.itemId
                        });
    
                        if (lineNum !== -1) {
                            itemFulfillment.selectLine({
                                sublistId: 'item',
                                line: lineNum
                            });
    
                            itemFulfillment.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'quantity',
                                value: item.quantity
                            });
    
                            itemFulfillment.commitLine({
                                sublistId: 'item'
                            });
                        }
                    });
                }
    
                var itemFulfillmentId = itemFulfillment.save();
    
                return {
                    success: true,
                    itemFulfillmentId: itemFulfillmentId
                };
    
            } catch (e) {
                return {
                    success: false,
                    message: e.message
                };
            }

        }

        /**
         * Defines the function that is executed when a DELETE request is sent to a RESTlet.
         * @param {Object} requestParams - Parameters from HTTP request URL; parameters are passed as an Object (for all supported
         *     content types)
         * @returns {string | Object} HTTP response body; returns a string when request Content-Type is 'text/plain'; returns an
         *     Object when request Content-Type is 'application/json' or 'application/xml'
         * @since 2015.2
         */
        const doDelete = (requestParams) => {

        }

        return { get, put, post, delete: doDelete }

    });
