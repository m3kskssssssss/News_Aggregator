#news_aggregator/forms.py

from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField, BooleanField, SelectMultipleField
from wtforms.validators import DataRequired, Email, EqualTo, Length, ValidationError
from wtforms.widgets import CheckboxInput, ListWidget
from models import User, NewsSource

class MultiCheckboxField(SelectMultipleField):
    widget = ListWidget(prefix_label=False)
    option_widget = CheckboxInput()

class LoginForm(FlaskForm):
    username = StringField('Логин', validators=[DataRequired()])
    password = PasswordField('Пароль', validators=[DataRequired()])
    remember_me = BooleanField('Запомнить меня')
    submit = SubmitField('Войти')

class RegistrationForm(FlaskForm):
    username = StringField('Логин', validators=[
        DataRequired(), Length(min=4, max=20)])
    email = StringField('Email', validators=[DataRequired(), Email()])
    password = PasswordField('Пароль', validators=[
        DataRequired(), Length(min=6)])
    password2 = PasswordField('Повторите пароль', validators=[
        DataRequired(), EqualTo('password')])
    submit = SubmitField('Зарегистрироваться')

    def validate_username(self, username):
        user = User.query.filter_by(username=username.data).first()
        if user is not None:
            raise ValidationError('Пользователь с таким логином уже существует.')

    def validate_email(self, email):
        user = User.query.filter_by(email=email.data).first()
        if user is not None:
            raise ValidationError('Пользователь с таким email уже существует.')

class SourceSelectionForm(FlaskForm):
    sources = MultiCheckboxField('Источники новостей', coerce=int)
    submit = SubmitField('Сохранить настройки')

    def __init__(self, *args, **kwargs):
        super(SourceSelectionForm, self).__init__(*args, **kwargs)
        self.sources.choices = [(source.id, source.name)
                               for source in NewsSource.query.filter_by(is_active=True).all()]