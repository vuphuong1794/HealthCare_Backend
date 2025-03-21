import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { SignupDto } from '../dtos/signup.dto';
import { User } from '../schemas/user.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { loginDto } from '../dtos/login.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(@InjectModel(User.name) private UserModel: Model<User>, private jwtService: JwtService) {}
    async signUp(signUpData: SignupDto) {
        const {email, password, name, phone} = signUpData; 
       const emailInUse = await this.UserModel.findOne({email});
       if(emailInUse) {
           throw new BadRequestException('Email already in use');
       }

       const hashedPassword = await bcrypt.hash(password, 10); // hash password

       await this.UserModel.create({
           email,
           password: hashedPassword,
           name,
           phone
       });
       return {
            message: 'User created successfully'
       }
    }

    async login(LoginData: loginDto){
        const {email, password} = LoginData;
        const user = await this.UserModel.findOne({email});
        if(!user) {
            throw new UnauthorizedException('User not found');
        }
        const passwordMatches = await bcrypt.compare(password, user.password);
        if(!passwordMatches) {
            throw new UnauthorizedException('Password is incorrect');
        }

        return this.generateUserTokens(user._id, user.email, user.name, user.role);
       
    }

    async generateUserTokens(userId, email, name, role) {
        const accessToken = this.jwtService.sign({userId, email, name, role}, {expiresIn: '1d'});
        return {
            accessToken
        }
    }
}
