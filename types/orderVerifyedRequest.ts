export type OrderVerifyedRequest = {
    type: 'ORDER-VERIFYED';
    key: string;
    data: {
        orderId: string;
    }
}