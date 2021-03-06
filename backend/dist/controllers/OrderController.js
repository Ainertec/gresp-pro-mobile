"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Order_1 = __importDefault(require("../models/Order"));
const Item_1 = __importDefault(require("../models/Item"));
class OrderController {
    constructor() {
        this.create = this.create.bind(this);
        this.update = this.update.bind(this);
    }
    async getOrderTotalAndAlert(items) {
        let total = 0;
        const alert = Array();
        await Promise.all(items.map(async (item) => {
            const consumedItem = await Item_1.default.findOne({ _id: item.product }).populate('ingredients.material');
            if (consumedItem) {
                if (consumedItem.stock && consumedItem.stock <= 10)
                    alert.push(consumedItem.name);
                if (consumedItem.ingredients) {
                    consumedItem.ingredients.map(ingredient => {
                        if (ingredient.material.stock <= 10) {
                            alert.push(consumedItem.name);
                        }
                    });
                }
                total += item.courtesy ? 0 : consumedItem.price * item.quantity;
            }
        }));
        return { total, alert };
    }
    async create(req, res) {
        const { identification, items, note } = req.body;
        if (await Order_1.default.findOne({ identification, closed: false }))
            return res.status(400).json('Order already exist');
        const orderInformations = await this.getOrderTotalAndAlert(items);
        const finalPrice = orderInformations.total;
        const order = await Order_1.default.create({
            identification,
            items,
            total: Number(finalPrice.toFixed(2)),
            note,
            finished: false,
        });
        await order.populate('items.product').execPopulate();
        req.io.emit('newOrder', order);
        return res.json({
            order,
            stockAlert: orderInformations.alert.length === 0
                ? undefined
                : orderInformations.alert,
        });
    }
    async update(req, res) {
        const { items, note } = req.body;
        const identification = Number(req.params.identification);
        const orderInformations = await this.getOrderTotalAndAlert(items);
        const finalPrice = orderInformations.total;
        const order = await Order_1.default.findOneAndUpdate({ identification, closed: false }, {
            identification,
            items,
            total: Number(finalPrice.toFixed(2)),
            note,
        }, {
            new: false,
        });
        const newOrder = await Order_1.default.findOne({
            identification,
            closed: false,
        }).populate('items.product');
        if (!order)
            return res.status(400).json('identification does not exist');
        // await order.populate('items.product').execPopulate();
        req.io.emit('updatedOrder', newOrder);
        return res.json({
            order: newOrder,
            oldItems: order.items,
            stockAlert: orderInformations.alert.length === 0
                ? undefined
                : orderInformations.alert,
        });
    }
    async delete(req, res) {
        const identification = Number(req.params.identification);
        const { payment } = req.params;
        const order = await Order_1.default.findOneAndUpdate({ identification, closed: false }, { closed: true, payment }, { new: true });
        req.io.emit('payment', order);
        return res.json('Order was closed with success!');
    }
    async deleteOne(req, res) {
        const { id } = req.params;
        await Order_1.default.deleteOne({ _id: id });
        return res.status(200).send();
    }
    async index(req, res) {
        const orders = await Order_1.default.find({ closed: false }).populate('items.product');
        return res.json(orders);
    }
    async show(req, res) {
        const identification = Number(req.params.identification);
        const order = await Order_1.default.findOne({
            identification,
            closed: false,
        }).populate('items.product');
        return res.json(order);
    }
    async addFees(req, res) {
        const { tip, cardfee } = req.body;
        const identification = Number(req.params.identification);
        const order = await Order_1.default.findOneAndUpdate({ identification, closed: false }, {
            tip,
            cardfee,
        }, {
            new: false,
        });
        const newOrder = await Order_1.default.findOne({
            identification,
            closed: false,
        }).populate('items.product');
        if (!order)
            return res.status(400).json('identification does not exist');
        // await order.populate('items.product').execPopulate();
        req.io.emit('updatedOrder', newOrder);
        return res.json({
            order: newOrder
        });
    }
}
exports.default = new OrderController();
//# sourceMappingURL=OrderController.js.map