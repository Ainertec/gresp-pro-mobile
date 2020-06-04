import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcrypt';

interface UserInterface extends Document {
  name: string;
  question: string;
  response: string;
  admin: boolean;
  checkPassword(password: string): Promise<boolean>;
}
interface UserSchemaInterface extends UserInterface {
  password: string;
  password_hash: string;
}

const Questions = Object.freeze({
  primeira: 'Qual o modelo do seu primeiro carro?',
  segunda: 'Qual o nome do seu melhor amigo de infância?',
  terceira: 'Qual o nome do seu primeiro animal de estimação?',
  quarta: 'Qual o nome da sua mãe?',
  quinta: 'Qual sua cor preferida?',
  getQuestions() {
    const ques = [this.primeira, this.segunda, this.terceira, this.quarta, this.quinta];
    return ques;
  },
});

const UserSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
  },
  password_hash: {
    type: String,
  },
  question: {
    type: String,
    enum: Object.values(Questions),
    required: true,
  },
  admin: {
    type: Boolean,
    default: false,
  },
  response: {
    type: String,
    required: true,
  },
});

Object.assign(UserSchema.statics, {
  Questions,
});

UserSchema.virtual('password', { type: String, require: true });

UserSchema.pre<UserSchemaInterface>('save', async function (next) {
  if (this.password) {
    const hash = await bcrypt.hash(this.password, 8);
    this.password_hash = hash;
  }
  next();
});

UserSchema.methods.checkPassword = function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password_hash);
};

// UserSchema.method('generateToken', function () {
//   return jwt.sign({ id: this._id }, process.env.APP_SECRET);
// });

export default model<UserInterface>('User', UserSchema);