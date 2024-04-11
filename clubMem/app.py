from flask import Flask, jsonify, request, render_template, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///memberdatabase.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

class Member(db.Model):
    __tablename__ = 'members'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    attendance_count = db.Column(db.Integer, default=0)
    paid_times = db.Column(db.Integer, default=0)
    not_paid_times = db.Column(db.Integer, default=0)
    amount_due = db.Column(db.Float, default=0.0)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'attendance_count': self.attendance_count,
            'paid_times': self.paid_times,
            'not_paid_times': self.not_paid_times,
            'amount_due': self.amount_due
        }

class Income(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.String(100), nullable=False)
    month = db.Column(db.String(50), nullable=False)
    amount = db.Column(db.Float, nullable=False)

    def to_dict(self):
        return {
            'type': self.type,
            'month': self.month,
            'amount': self.amount
        }

class Expense(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.String(100), nullable=False)
    month = db.Column(db.String(50), nullable=False)
    amount = db.Column(db.Float, nullable=False)

    def to_dict(self):
        return {
            'type': self.type,
            'month': self.month,
            'amount': self.amount
        }
        
migrate = Migrate(app, db)

@app.route('/')
def index():
    return redirect(url_for('show_members'))

@app.route('/members', methods=['GET'])
def get_members():
    members_list = Member.query.all()
    members = [member.to_dict() for member in members_list]
    return jsonify(members)

@app.route('/members', methods=['POST'])
def add_member():
    data = request.json
    new_member = Member(name=data['name'], email=data['email'], attendance_count=0, paid_times=0, not_paid_times=0)
    db.session.add(new_member)
    try:
        db.session.commit()
        return jsonify({'message': 'Member added successfully'}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Error adding member'}), 500

@app.route('/members/view', methods=['GET']) 
def show_members():
    members_list = Member.query.all()
    return render_template('members.html', members=members_list)

@app.route('/members/<int:member_id>', methods=['DELETE'])
def delete_member(member_id):
    member = Member.query.get(member_id)
    if member:
        db.session.delete(member)
        db.session.commit()
        return jsonify({'message': 'Member removed successfully'}), 200
    else:
        return jsonify({'message': 'Member not found'}), 404

@app.route('/members/<int:member_id>/discount', methods=['PATCH'])
def discount_member(member_id):
    member = Member.query.get(member_id)
    if member:
        if member.amount_due is None:
            member.amount_due = 0.0 
        member.amount_due *= 0.9
        db.session.commit()
        return jsonify({'message': 'Discount applied successfully'}), 200
    else:
        return jsonify({'message': 'Member not found'}), 404

@app.route('/api/finances', methods=['GET'])
def api_finances():
    incomes_query = Income.query
    expenses_query = Expense.query
    filter_month = request.args.get('month')
    filter_revenue_type = request.args.get('revenue_type')
    filter_expense_type = request.args.get('expense_type')

    if filter_month:
        incomes_query = incomes_query.filter_by(month=filter_month)
        expenses_query = expenses_query.filter_by(month=filter_month)
    if filter_revenue_type:
        incomes_query = incomes_query.filter_by(type=filter_revenue_type)
    if filter_expense_type:
        expenses_query = expenses_query.filter_by(type=filter_expense_type)

    incomes = incomes_query.all() 
    expenses = expenses_query.all() 
    financial_details = {}
    months = ['January', 'February', 'March', 'April'] 
    for month in months:
        month_incomes = [income for income in incomes if income.month == month]
        month_expenses = [expense for expense in expenses if expense.month == month]
        revenue = [income.to_dict() for income in month_incomes]
        expenses_data = [expense.to_dict() for expense in month_expenses]
        profit = sum(income.amount for income in month_incomes) - sum(expense.amount for expense in month_expenses)
        financial_details[month] = {
            'revenue': revenue,
            'expenses': expenses_data,
            'profit': profit
        }
    sorted_financial_details = {month: financial_details.get(month, {'revenue': [], 'expenses': [], 'profit': 0}) for month in months}
    total_income = sum(income.amount for income in incomes)
    total_expenses = sum(expense.amount for expense in expenses)
    total_profit = total_income - total_expenses

    return jsonify({
        'financial_details': sorted_financial_details,
        'total_income': total_income,
        'total_expenses': total_expenses,
        'total_profit': total_profit
    })

@app.route('/finances', methods=['GET'])
def show_finances():
    all_incomes = Income.query.all()
    all_expenses = Expense.query.all()
    financial_details = {}
    for month in ['January', 'February', 'March', 'April']:
        monthly_incomes = [income.to_dict() for income in all_incomes if income.month == month]
        monthly_expenses = [expense.to_dict() for expense in all_expenses if expense.month == month]
        profit = sum(item['amount'] for item in monthly_incomes) - sum(item['amount'] for item in monthly_expenses)
        financial_details[month] = {
            'revenue': monthly_incomes,
            'expenses': monthly_expenses,
            'profit': profit
        }
    total_income = sum(income.amount for income in all_incomes)
    total_expenses = sum(expense.amount for expense in all_expenses)
    total_profit = total_income - total_expenses
    return render_template('finances.html',
                           financial_details=financial_details,
                           total_income=total_income,
                           total_expenses=total_expenses,
                           total_profit=total_profit)

@app.route('/add_income', methods=['POST'])
def add_income():
    data = request.get_json()
    new_income = Income(type=data['type'], month=data['month'], amount=data['amount'])
    db.session.add(new_income)
    db.session.commit()
    return jsonify({'message': 'Income added successfully'}), 201

@app.route('/add_expense', methods=['POST'])
def add_expense():
    data = request.get_json()
    new_expense = Expense(type=data['type'], month=data['month'], amount=data['amount'])
    db.session.add(new_expense)
    db.session.commit()
    return jsonify({'message': 'Expense added successfully'}), 201

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
