/* eslint-disable array-callback-return */
/* eslint-disable consistent-return */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-restricted-syntax */
import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { format } from 'date-fns';
// import '../@types/jsrtg.d.ts'
import JsRtf from 'jsrtf';
import Order from '../models/Order';
import { ItemsInterface } from '../interfaces/base';

export interface OldItems {
  product: string;
  quantity: number;
}

class PrinterController {
  constructor() {
    this.create = this.create.bind(this);
  }

  private toPrinterUpdated(items: ItemsInterface[], oldItems: OldItems[]) {
    const products: ItemsInterface[] = [];
    const drinks: ItemsInterface[] = [];

    oldItems.map(oldItem => {
      const position = items.findIndex(
        item =>
          String(item.product._id) === String(oldItem.product) &&
          item.quantity === oldItem.quantity,
      );
      if (position >= 0) {
        items.splice(position, 1);
      }
    });
    items.map(item => {
      if (item.product.drink) {
        drinks.push(item);
      } else {
        products.push(item);
      }
    });
    return { products, drinks };

    //     for (const item of items) {
    //       if (item.product.drink) {
    //         drinks += `* ${item?.product.name}
    // - Quantidade: ${item.quantity}\n
    // ${item.courtesy && 'Cortesia'}`;
    //       } else {
    //         products += `* ${item.product.name}
    // - Quantidade: ${item.quantity}\n
    // ${item.courtesy && 'Cortesia'}`;
    //       }
    //     }
    // return { products, drinks };
  }

  private toPrinterNew(items: ItemsInterface[]) {
    const products: ItemsInterface[] = [];
    const drinks: ItemsInterface[] = [];

    items.map(item => {
      if (item.product.drink) {
        drinks.push(item);
      } else {
        products.push(item);
      }
    });
    return { products, drinks };
  }

  async create(req: Request, res: Response) {
    const { identification, oldItems, type } = req.body;
    const order = await Order.findOne({ closed: false, identification });

    if (!order) return res.status(400).json('orders does not exist!');

    await order.populate('items.product').execPopulate();

    const date = order.updatedAt
      ? format(order.updatedAt, 'dd/MM/yyyy HH:mm:ss')
      : '';
    const myDoc = new JsRtf({
      language: JsRtf.Language.BR,
      pageWidth: JsRtf.Utils.mm2twips(58),
      landscape: false,
      marginLeft: 5,
      marginRight: 2,
    });
    const contentStyle = new JsRtf.Format({
      spaceBefore: 20,
      spaceAfter: 20,
      fontSize: 8,
      paragraph: true,
    });
    const contentBorder = new JsRtf.Format({
      spaceBefore: 100,
      spaceAfter: 100,
      fontSize: 8,
      paragraph: true,
      borderBottom: { type: 'single', width: 10 },
    });
    const header = new JsRtf.Format({
      spaceBefore: 20,
      spaceAfter: 100,
      fontSize: 8,
      bold: true,
      paragraph: true,
      align: 'center',
      borderTop: { size: 2, spacing: 100, color: JsRtf.Colors.GREEN },
    });

    if (order.items) {
      const items = type
        ? this.toPrinterNew(order.items)
        : this.toPrinterUpdated(order.items, oldItems);

      myDoc.writeText('', contentBorder);
      myDoc.writeText('>>>>>>>>> Comanda <<<<<<<<<<', header);
      myDoc.writeText(`Número: ${order.identification}`, header);
      type
        ? myDoc.writeText(`Tipo: Novo`, header)
        : myDoc.writeText(`Tipo: Atualizado`, header);
      myDoc.writeText('=========== Produtos ==========', contentBorder);
      items.products.map(item => {
        myDoc.writeText(
          `* ${item.product.name} ${item.courtesy && '/ Cortesia'}`,
          contentStyle,
        );
        myDoc.writeText(`- Quantidade: ${item.quantity}`, contentStyle);
        // item.courtesy && myDoc.writeText(`Cortesia`, contentStyle);
      });
      myDoc.writeText('=========== Bebidas ===========', contentBorder);
      items.drinks.map(item => {
        myDoc.writeText(
          `* ${item.product.name} ${item.courtesy && '/ Cortesia'}`,
          contentStyle,
        );
        myDoc.writeText(`- Quantidade: ${item.quantity}`, contentStyle);
        // item.courtesy && myDoc.writeText(`Cortesia`, contentStyle);
      });
      myDoc.writeText('========== Observação =========', contentStyle);
      myDoc.writeText(
        `\n- ${order.note ? order.note : 'Nenhuma.'}\n`,
        contentStyle,
      );
      myDoc.writeText(`- ${date}`, contentStyle);

      const content = myDoc.createDocument();

      const buffer = Buffer.from(content, 'binary');

      const dir =
        process.env.NODE_ENV === 'test'
          ? path.resolve(__dirname, '..', '..', '__tests__', 'recipes')
          : path.resolve('commands', 'commandsCreate');

      fs.writeFile(
        `${dir}/${identification}.rtf`,
        buffer,
        { encoding: 'utf-8', flag: 'w' },
        err => {
          if (err) return res.status(400).json(`${err}`);
          return res.status(200).json('success');
        },
      );
    } else {
      return res.status(400).json('There are no items');
    }
  }
}

export default new PrinterController();
