import type { OopChallenge } from './types';

const py = String.raw;

/**
 * Progressive OOP challenge bank (scope correction §4). Each challenge adds one or two concepts.
 * The Canva challenge reproduces the ColorStack-reported requirements and labels every inferred
 * requirement (the source screenshot was partly obscured). Solutions run under tests.
 */
export const oopChallenges: OopChallenge[] = [
  {
    id: 'phone-book', order: 1, title: 'Phone book',
    evidence: 'github-historical', evidenceNote: 'Historical report: "choose a data structure for a phone book containing names and phone numbers; implement and explain it"',
    prereqs: ['oop/classes-objects'],
    concepts: ['Classes and objects', 'Constructors and self', 'Choosing the container (dict keyed by name)'],
    brief: 'Build a phone book that stores names and phone numbers. Choose and justify the data structure: what does each operation cost?',
    requirements: [
      'add(name, number) stores a contact; adding an existing name updates its number.',
      'lookup(name) returns the number, or None if the name is unknown.',
      'delete(name) removes a contact and returns True, or False if it was not there.',
      'names_starting_with(prefix) returns the matching names in alphabetical order.',
      'Explain the time complexity of every method and why you chose the structure.',
    ],
    inferred: [],
    stages: [
      'Write a PhoneBook class whose constructor creates an empty dict.',
      'Implement add and lookup; test an update of an existing name.',
      'Implement delete with a boolean result.',
      'Implement names_starting_with — then say its cost and what structure would make it faster (sorted list + binary search, or a trie).',
    ],
    clarify: ['Can two people share a name? (Assume no: names are unique keys.)', 'Should lookup be case-sensitive?', 'Is prefix search important enough to optimise?'],
    starter: py`
class PhoneBook:
    def __init__(self):
        pass

    def add(self, name, number):
        pass

    def lookup(self, name):
        pass

    def delete(self, name):
        pass

    def names_starting_with(self, prefix):
        pass
`,
    solution: py`
class PhoneBook:
    """dict name -> number: O(1) average add / lookup / delete; prefix search scans O(n) and sorts the matches."""

    def __init__(self):
        self._numbers = {}

    def add(self, name, number):
        self._numbers[name] = number           # insert or update

    def lookup(self, name):
        return self._numbers.get(name)

    def delete(self, name):
        if name not in self._numbers:
            return False
        del self._numbers[name]
        return True

    def names_starting_with(self, prefix):
        return sorted(n for n in self._numbers if n.startswith(prefix))

book = PhoneBook()
book.add("Ana", "407-555-0100")
book.add("Andre", "407-555-0101")
book.add("Ben", "407-555-0102")
book.add("Ana", "407-555-0199")                # update
assert book.lookup("Ana") == "407-555-0199"
assert book.lookup("Zoe") is None
assert book.names_starting_with("An") == ["Ana", "Andre"]
assert book.delete("Ben") is True and book.delete("Ben") is False
assert book.names_starting_with("") == ["Ana", "Andre"]
`,
    followUps: ['Why a dict and not a list of (name, number) tuples? Give the cost of lookup in each.', 'How would you support many numbers per person?', 'How would you make prefix search fast for millions of names?'],
  },
  {
    id: 'bank-account', order: 2, title: 'Bank accounts',
    prereqs: ['oop/classes-objects', 'oop/inheritance-composition'],
    concepts: ['Instance attributes and methods', 'Validation', 'Inheritance and super()', 'Overriding'],
    brief: 'Model bank accounts with deposits, withdrawals and transfers, plus a savings account that earns interest and limits withdrawals.',
    requirements: [
      'Account(owner, balance=0) with deposit(amount) and withdraw(amount).',
      'Reject non-positive amounts and overdrafts by raising ValueError; a rejected call must not change the balance.',
      'Keep a history list of (kind, amount) for successful operations.',
      'transfer(other, amount) moves money between accounts, all-or-nothing.',
      'SavingsAccount(Account) adds add_interest(rate) and allows at most 3 withdrawals (call reset_month() to start a new month).',
    ],
    inferred: [],
    stages: [
      'Account with deposit and withdraw; validate amounts first.',
      'Add the history list and check it after a rejected call.',
      'Add transfer — make sure a failed withdraw leaves both accounts unchanged.',
      'Write SavingsAccount using super().__init__ and override withdraw to enforce the limit.',
    ],
    clarify: ['Raise an exception, return False, or print? (This challenge: raise ValueError.)', 'Is the interest rate a percentage or a fraction?', 'Do transfers count as withdrawals for the savings limit?'],
    starter: py`
class Account:
    def __init__(self, owner, balance=0):
        pass

    def deposit(self, amount):
        pass

    def withdraw(self, amount):
        pass

    def transfer(self, other, amount):
        pass


class SavingsAccount(Account):
    pass
`,
    solution: py`
class Account:
    def __init__(self, owner, balance=0):
        self.owner = owner
        self.balance = balance
        self.history = []

    @staticmethod
    def _check(amount):
        if amount <= 0:
            raise ValueError("amount must be positive")

    def deposit(self, amount):
        self._check(amount)
        self.balance += amount
        self.history.append(("deposit", amount))

    def withdraw(self, amount):
        self._check(amount)
        if amount > self.balance:
            raise ValueError("insufficient funds")
        self.balance -= amount
        self.history.append(("withdraw", amount))

    def transfer(self, other, amount):
        self.withdraw(amount)          # raises before anything changes if invalid
        other.deposit(amount)


class SavingsAccount(Account):
    LIMIT = 3

    def __init__(self, owner, balance=0):
        super().__init__(owner, balance)
        self.withdrawals = 0

    def withdraw(self, amount):
        if self.withdrawals >= self.LIMIT:
            raise ValueError("monthly withdrawal limit reached")
        super().withdraw(amount)       # validation and history from the parent
        self.withdrawals += 1

    def add_interest(self, rate):
        interest = round(self.balance * rate, 2)
        if interest > 0:
            self.deposit(interest)

    def reset_month(self):
        self.withdrawals = 0


a, b = Account("Ana", 100), Account("Ben")
a.transfer(b, 40)
assert (a.balance, b.balance) == (60, 40)
for bad in (0, -5, 1000):
    try:
        a.withdraw(bad)
        assert False, "should have raised"
    except ValueError:
        pass
assert a.balance == 60 and a.history == [("withdraw", 40)]
try:
    a.transfer(b, 500)
except ValueError:
    pass
assert (a.balance, b.balance) == (60, 40)     # all-or-nothing

s = SavingsAccount("Cy", 1000)
s.add_interest(0.05)
assert s.balance == 1050
for _ in range(3):
    s.withdraw(10)
try:
    s.withdraw(10)
    assert False
except ValueError:
    pass
s.reset_month()
s.withdraw(10)
assert s.balance == 1010 and isinstance(s, Account)
`,
    followUps: ['Why does transfer call withdraw before deposit?', 'What would break if two threads called withdraw at the same time? (Discuss only.)', 'Should balance be a float? What would you use for money in production?'],
  },
  {
    id: 'library', order: 3, title: 'Library management system',
    prereqs: ['oop/inheritance-composition', 'oop/references-collections'],
    concepts: ['Composition', 'Managing collections of objects', 'Object references', 'Validation'],
    brief: 'Model a small library: books with unique ISBNs, members, checkouts and returns, with a per-member limit.',
    requirements: [
      'Book(isbn, title, author) and Member(member_id, name).',
      'Library.add_book and add_member reject duplicates (same ISBN / member id) and return False.',
      'checkout(member_id, isbn) succeeds only if both exist, the book is available, and the member has fewer than 3 books.',
      'return_book(member_id, isbn) succeeds only if that member has that book.',
      'available_books() returns titles of books not checked out, in the order they were added.',
      'Every method returns True/False (or a list) — no exceptions for normal rejections.',
    ],
    inferred: [],
    stages: [
      'Book and Member classes; Library holding two dicts keyed by ISBN and member id.',
      'add_book / add_member with duplicate checks.',
      'Track who has which book (a dict isbn → member_id, plus each member\'s set of ISBNs).',
      'checkout / return_book with all validations before any state change.',
      'available_books, then test the 3-book limit.',
    ],
    clarify: ['Can the library own several copies of one ISBN? (Assume one.)', 'What should checkout report: a bool, a reason, or an exception?', 'Is the borrowing limit per member or global?'],
    starter: py`
class Book:
    def __init__(self, isbn, title, author):
        pass

class Member:
    def __init__(self, member_id, name):
        pass

class Library:
    MAX_BOOKS = 3

    def __init__(self):
        pass

    def add_book(self, book):
        pass

    def add_member(self, member):
        pass

    def checkout(self, member_id, isbn):
        pass

    def return_book(self, member_id, isbn):
        pass

    def available_books(self):
        pass
`,
    solution: py`
class Book:
    def __init__(self, isbn, title, author):
        self.isbn, self.title, self.author = isbn, title, author

class Member:
    def __init__(self, member_id, name):
        self.member_id, self.name = member_id, name
        self.books = set()                     # ISBNs currently borrowed

class Library:
    MAX_BOOKS = 3

    def __init__(self):
        self.books = {}                        # isbn -> Book (insertion ordered)
        self.members = {}                      # member_id -> Member
        self.loans = {}                        # isbn -> member_id

    def add_book(self, book):
        if book.isbn in self.books:
            return False
        self.books[book.isbn] = book
        return True

    def add_member(self, member):
        if member.member_id in self.members:
            return False
        self.members[member.member_id] = member
        return True

    def checkout(self, member_id, isbn):
        member = self.members.get(member_id)
        if member is None or isbn not in self.books:
            return False
        if isbn in self.loans or len(member.books) >= self.MAX_BOOKS:
            return False
        self.loans[isbn] = member_id
        member.books.add(isbn)
        return True

    def return_book(self, member_id, isbn):
        if self.loans.get(isbn) != member_id:
            return False
        del self.loans[isbn]
        self.members[member_id].books.discard(isbn)
        return True

    def available_books(self):
        return [b.title for isbn, b in self.books.items() if isbn not in self.loans]

lib = Library()
for i in range(5):
    assert lib.add_book(Book(f"isbn{i}", f"Title {i}", "Author"))
assert lib.add_book(Book("isbn0", "Dup", "X")) is False
assert lib.add_member(Member(1, "Ana")) and lib.add_member(Member(2, "Ben"))
assert lib.add_member(Member(1, "Imposter")) is False
assert lib.checkout(1, "isbn0") and lib.checkout(1, "isbn1") and lib.checkout(1, "isbn2")
assert lib.checkout(1, "isbn3") is False              # limit of 3
assert lib.checkout(2, "isbn0") is False              # already out
assert lib.checkout(3, "isbn4") is False              # unknown member
assert lib.return_book(2, "isbn0") is False           # Ben does not have it
assert lib.return_book(1, "isbn0") is True
assert lib.available_books() == ["Title 0", "Title 3", "Title 4"]
assert lib.checkout(2, "isbn0") is True
`,
    followUps: ['Why keep both loans (isbn → member) and member.books? What could go out of sync?', 'How would you add multiple copies of the same ISBN?', 'How would you find all overdue books if each loan had a due date?'],
  },
  {
    id: 'parking-lot', order: 4, title: 'Parking lot',
    prereqs: ['oop/inheritance-composition', 'oop/references-collections', 'oop/copying'],
    concepts: ['Inheritance (vehicle types)', 'Composition (lot has spots)', 'Validation', 'Choosing structures for fast lookups'],
    brief: 'A parking lot with small and large spots. Motorcycles and cars fit small or large spots; trucks need a large spot. Park, leave, and report free spots.',
    requirements: [
      'Vehicle(plate) with subclasses Motorcycle, Car, Truck; each knows whether it can use a small spot.',
      'ParkingLot(small, large) creates that many spots.',
      'park(vehicle) puts the vehicle in the first suitable free spot — small spots first when allowed — and returns the spot id, or None if no spot fits or the plate is already parked.',
      'leave(plate) frees the spot and returns True, or False if the plate is not parked.',
      'free_spots() returns {"small": n, "large": m}.',
    ],
    inferred: [],
    stages: [
      'Vehicle hierarchy with a can_use_small() method (polymorphism instead of type checks).',
      'ParkingLot storing free spot ids per size (lists used as stacks) and a plate → spot dict.',
      'park and leave with validations; keep park O(1).',
      'free_spots, then test a full lot and a truck when only small spots remain.',
    ],
    clarify: ['Which spot should be chosen when several fit?', 'Can a car take a large spot when small ones are full? (Yes.)', 'Do we need to know which vehicle is in which spot later?'],
    starter: py`
class Vehicle:
    def __init__(self, plate):
        pass

    def can_use_small(self):
        pass

class Motorcycle(Vehicle):
    pass

class Car(Vehicle):
    pass

class Truck(Vehicle):
    pass

class ParkingLot:
    def __init__(self, small, large):
        pass

    def park(self, vehicle):
        pass

    def leave(self, plate):
        pass

    def free_spots(self):
        pass
`,
    solution: py`
class Vehicle:
    def __init__(self, plate):
        self.plate = plate

    def can_use_small(self):
        return True

class Motorcycle(Vehicle):
    pass

class Car(Vehicle):
    pass

class Truck(Vehicle):
    def can_use_small(self):          # override instead of checking types elsewhere
        return False

class ParkingLot:
    def __init__(self, small, large):
        # Free spot ids per size; pop() / append() are O(1).
        self.free = {"small": [f"S{i}" for i in range(small, 0, -1)],
                     "large": [f"L{i}" for i in range(large, 0, -1)]}
        self.where = {}               # plate -> (size, spot id)

    def park(self, vehicle):
        if vehicle.plate in self.where:
            return None
        sizes = ["small", "large"] if vehicle.can_use_small() else ["large"]
        for size in sizes:
            if self.free[size]:
                spot = self.free[size].pop()
                self.where[vehicle.plate] = (size, spot)
                return spot
        return None

    def leave(self, plate):
        if plate not in self.where:
            return False
        size, spot = self.where.pop(plate)
        self.free[size].append(spot)
        return True

    def free_spots(self):
        return {size: len(ids) for size, ids in self.free.items()}

lot = ParkingLot(small=1, large=1)
assert lot.park(Car("CAR1")) == "S1"
assert lot.park(Car("CAR1")) is None             # already parked
assert lot.park(Truck("TRK1")) == "L1"
assert lot.park(Motorcycle("MOTO")) is None      # full
assert lot.free_spots() == {"small": 0, "large": 0}
assert lot.leave("CAR1") and not lot.leave("CAR1")
assert lot.park(Truck("TRK2")) is None           # only a small spot is free
assert lot.park(Motorcycle("MOTO")) == "S1"
assert isinstance(Truck("X"), Vehicle)
`,
    followUps: ['Why is can_use_small a method on Vehicle instead of an if-chain in park?', 'What is the cost of park and leave? How would it change if you searched a list of spots?', 'How would you add pricing by the hour?'],
  },
  {
    id: 'canva', order: 5, title: 'Simplified Canva',
    evidence: 'colorstack-reported', evidenceNote: 'ColorStack-reported: a member\'s Codility OOP question (screenshot partly obscured). Requirements below are the visible ones; everything under "Inferred" is this app\'s assumption.',
    prereqs: ['oop/classes-objects', 'oop/inheritance-composition', 'oop/references-collections', 'oop/copying'],
    concepts: ['Inheritance (Element → TextElement, ImageElement)', 'Composition (Canvas has elements)', 'Unique names', 'Bounds validation with printed messages', 'Cloning (deep copy + new name)'],
    brief: 'Implement a tiny design canvas: generic elements, text and image elements, a canvas with a size, adding elements with validation, and cloning an element by name.',
    requirements: [
      'A generic Element class representing an element on a canvas.',
      'Element has a name property that uniquely identifies it.',
      'A TextElement class with text-related properties.',
      'An ImageElement class containing an image URL.',
      'A Canvas class initialized with a width and height.',
      'The canvas maintains a list of elements.',
      'A function that adds an element to the canvas.',
      'Reject elements outside the canvas boundaries and print an appropriate message.',
      'Reject elements that already exist and print an appropriate message.',
      'A function that clones an element by specifying its name.',
    ],
    inferred: [
      'Position and size: every Element has x, y, width and height (the coordinate properties were obscured in the source).',
      '"Outside the boundaries" means any part of the element lies outside 0 ≤ x, 0 ≤ y, x + width ≤ canvas width, y + height ≤ canvas height. Partially outside is rejected.',
      'Width and height must be positive.',
      '"Already exists" means another element on the canvas has the same name.',
      'Text properties: text, font_size (default 16) and color (default "#000000").',
      'add_element returns True/False in addition to printing, so it can be tested.',
      'clone_element(name) deep-copies the element, names the copy "<name>_copy" (then "_copy_copy" … if taken), offsets it by (10, 10), validates it like any added element, and returns the clone or None.',
      'Message wording is free; it must say what was rejected and why.',
    ],
    stages: [
      'Element with name, x, y, width, height. Then TextElement and ImageElement using super().__init__.',
      'Canvas(width, height) with self.elements = [] (as stated) and a name → element dict for O(1) checks.',
      'add_element: check bounds → print and return False; check duplicate name → print and return False; otherwise store both and return True.',
      'clone_element: unknown name → print, return None; deep copy, rename uniquely, offset, then reuse add_element\'s validation.',
      'Test: inside, partially outside, duplicate, clone, clone of a clone, clone that would fall outside.',
    ],
    clarify: [
      'What coordinates does an element have — x/y only, or a size as well? Is (x, y) the top-left corner?',
      'Is an element touching the edge (x + width == canvas width) inside?',
      'Does "already exists" mean the same name or the same object?',
      'What should a clone be called, and where should it be placed? Should it be added to the canvas automatically?',
      'Should a clone share any properties with the original (e.g. an image URL is immutable, but a style list is not)?',
    ],
    starter: py`
import copy

class Element:
    def __init__(self, name, x, y, width, height):
        pass

class TextElement(Element):
    def __init__(self, name, x, y, width, height, text, font_size=16, color="#000000"):
        pass

class ImageElement(Element):
    def __init__(self, name, x, y, width, height, url):
        pass

class Canvas:
    def __init__(self, width, height):
        pass

    def add_element(self, element):
        pass

    def clone_element(self, name):
        pass
`,
    solution: py`
import copy

class Element:
    def __init__(self, name, x, y, width, height):
        self.name = name
        self.x, self.y = x, y
        self.width, self.height = width, height

    def __repr__(self):
        return f"{type(self).__name__}({self.name!r}, x={self.x}, y={self.y}, w={self.width}, h={self.height})"

class TextElement(Element):
    def __init__(self, name, x, y, width, height, text, font_size=16, color="#000000"):
        super().__init__(name, x, y, width, height)
        self.text = text
        self.font_size = font_size
        self.color = color

class ImageElement(Element):
    def __init__(self, name, x, y, width, height, url):
        super().__init__(name, x, y, width, height)
        self.url = url

class Canvas:
    def __init__(self, width, height):
        self.width, self.height = width, height
        self.elements = []                 # required: a list of elements (keeps order)
        self._by_name = {}                 # index for O(1) duplicate checks and lookup by name

    def _fits(self, e):
        return (e.width > 0 and e.height > 0 and e.x >= 0 and e.y >= 0
                and e.x + e.width <= self.width and e.y + e.height <= self.height)

    def add_element(self, element):
        if not self._fits(element):
            print(f"Rejected '{element.name}': outside the {self.width}x{self.height} canvas")
            return False
        if element.name in self._by_name:
            print(f"Rejected '{element.name}': an element with this name already exists")
            return False
        self.elements.append(element)
        self._by_name[element.name] = element
        return True

    def clone_element(self, name):
        original = self._by_name.get(name)
        if original is None:
            print(f"Cannot clone '{name}': no such element")
            return None
        clone = copy.deepcopy(original)    # independent copy of every property
        clone.name = name + "_copy"
        while clone.name in self._by_name:
            clone.name += "_copy"
        clone.x += 10
        clone.y += 10
        return clone if self.add_element(clone) else None


canvas = Canvas(500, 300)
title = TextElement("title", 10, 10, 200, 40, "Hello", font_size=24)
logo = ImageElement("logo", 415, 20, 80, 80, "https://example.com/logo.png")
assert canvas.add_element(title) is True
assert canvas.add_element(logo) is True
assert canvas.add_element(ImageElement("huge", 450, 0, 100, 100, "u")) is False   # partly outside
assert canvas.add_element(TextElement("title", 0, 0, 10, 10, "dup")) is False      # duplicate name
assert canvas.add_element(Element("edge", 0, 0, 500, 300)) is True                # touching edges is inside

c1 = canvas.clone_element("title")
assert c1 is not None and c1.name == "title_copy" and (c1.x, c1.y) == (20, 20)
assert c1.text == "Hello" and c1.font_size == 24 and isinstance(c1, TextElement)
c1.text = "Changed"
assert title.text == "Hello"                                      # independent copy
c2 = canvas.clone_element("title")
assert c2.name == "title_copy_copy"
assert canvas.clone_element("logo") is None                       # clone would fall outside (425 + 80 > 500)
assert canvas.clone_element("missing") is None
assert [e.name for e in canvas.elements] == ["title", "logo", "edge", "title_copy", "title_copy_copy"]
`,
    followUps: [
      'Your elements list and name index could disagree. How do you guarantee they stay in sync? (One method adds to both.)',
      'How would you add remove_element(name) and move_element(name, dx, dy) with the same validation?',
      'What changes if elements can overlap only on different layers (z-order)?',
      'Why deepcopy rather than copy.copy for clone? When would a shallow copy be fine here?',
      'What is the cost of add_element with the dict index versus scanning the list for duplicates?',
    ],
  },
];

export function getOopChallenge(id: string): OopChallenge | undefined {
  return oopChallenges.find((c) => c.id === id);
}
