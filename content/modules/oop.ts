import type { Module } from '../types';

const py = String.raw;

/**
 * Module 15 — Practical Python OOP (added Nov 25, scope correction §4).
 * Deliberately limited to what an Explore-level OOP question needs: the ColorStack-reported
 * "simplified Canva" question and the challenge bank in content/oop-challenges.ts. No design-
 * pattern catalog, no architecture course.
 */
export const oopModule: Module = {
  id: 'oop',
  number: 15,
  title: 'Practical Python OOP',
  priority: 'P0',
  phase: 1,
  blurb: 'Only what an Explore OOP question needs: classes, constructors, inheritance, composition, references, collections of objects, validation and copying. Builds up to the reported Canva question.',
  prerequisites: ['python'],
  lessons: [
    // ------------------------------------------------------------------------------------------
    {
      id: 'classes-objects',
      title: 'Classes, objects, constructors and self',
      summary: 'A class is a blueprint; an object is one instance with its own attributes. `__init__` sets them up; `self` is the instance a method is working on.',
      what: "A **class** describes a kind of thing: the data each one holds (**instance attributes**) and what it can do (**methods**). An **object** (instance) is one concrete thing made from the class.\n\n- `__init__(self, ...)` is the **constructor**: Python calls it right after creating the object, so it is where you set the starting attributes.\n- `self` is the object the method was called on. `acct.deposit(50)` runs `deposit` with `self = acct`. You must write `self` as the first parameter and use `self.balance`, not `balance`.\n- **Instance attributes** (`self.balance`) belong to one object. **Class attributes** (written in the class body) are shared by every object.\n- A **method** is a function defined in the class. It reads and changes `self`'s attributes and should keep them valid.\n- `__repr__` returns a developer-friendly string, which makes printing and debugging much easier.",
      why: "Every OOP interview question starts here: \"create a class that represents…\". Getting `__init__` and `self` right without thinking frees your attention for the actual requirements, like validation and uniqueness in the Canva question.",
      how: [
        "Read the requirements and underline the nouns (account, contact, canvas) — they are classes — and the verbs (deposit, add, clone) — they are methods.",
        "Decide each class's attributes and write `__init__` to set them, with sensible defaults.",
        "Write each method so it either returns a value or changes `self` — and keeps the object valid (no negative balance).",
        "Add `__repr__` so you can print objects while testing.",
        "Create two objects and show they have separate state; that is a 10-second test interviewers like to see.",
      ],
      code: py`
class BankAccount:
    bank_name = "Explore Bank"          # class attribute: shared by all accounts

    def __init__(self, owner, balance=0):
        self.owner = owner              # instance attributes: one copy per object
        self.balance = balance

    def deposit(self, amount):
        self.balance += amount
        return self.balance

    def withdraw(self, amount):
        if amount > self.balance:       # keep the object valid
            return False
        self.balance -= amount
        return True

    def __repr__(self):
        return f"BankAccount({self.owner!r}, {self.balance})"

a = BankAccount("Ana", 100)
b = BankAccount("Ben")                  # default balance
a.deposit(50)
assert a.balance == 150 and b.balance == 0          # separate state per object
assert a.withdraw(500) is False and a.balance == 150
assert a.withdraw(20) is True and a.balance == 130
assert a.bank_name == b.bank_name == "Explore Bank"
assert repr(a) == "BankAccount('Ana', 130)"

# a.deposit(5) is just shorthand for BankAccount.deposit(a, 5): self is a.
BankAccount.deposit(a, 5)
assert a.balance == 135
`,
      codeNotes: [
        "`balance=0` is a default argument: `BankAccount(\"Ben\")` gets 0.",
        "`f\"{self.owner!r}\"` uses `repr()` of the value, so strings appear with quotes.",
        "`BankAccount.deposit(a, 5)` shows what `a.deposit(5)` really does: it passes `a` as `self`.",
      ],
      complexity: {
        time: 'Each method here is O(1)',
        space: 'O(1) per object',
        derivation: [
          "deposit and withdraw do a comparison and an addition — constant work regardless of the balance.",
          "In an OOP question, state the cost of EACH method separately; the interesting ones are methods that loop over a collection.",
        ],
      },
      whenToUse: [
        "\"Design/implement a class that…\" questions (phone book, bank account, Canva).",
        "LeetCode design problems such as Min Stack (LC 155) and Implement Queue using Stacks (LC 232).",
        "Any time several pieces of data must always change together.",
      ],
      mistakes: [
        "Forgetting `self` as the first parameter, or writing `balance` instead of `self.balance` inside a method.",
        "Setting attributes outside `__init__` so some objects do not have them.",
        "Putting a mutable value in a class attribute (`items = []`) — it is shared by every object.",
        "Printing inside methods instead of returning values, which makes them hard to test (print only when the requirement says so).",
      ],
      checks: [
        { q: "What is `self` inside `a.withdraw(20)`?", options: ['The class BankAccount', 'The object a', 'The number 20', 'A copy of a'], answer: 1, explain: "Python passes the object the method was called on as the first argument." },
        { q: "Two accounts are created; one deposits 50. Why does the other's balance stay 0?", options: ['balance is a class attribute', 'balance is an instance attribute set in __init__, so each object has its own', 'deposit returns a copy', 'Python copies objects on every call'], answer: 1, explain: "`self.balance = …` in `__init__` creates a separate attribute per object." },
        { q: "Where should a starting balance be set?", options: ['In the class body as `balance = 0`', 'In `__init__` as `self.balance = balance`', 'In `__repr__`', 'In each method'], answer: 1, explain: "The constructor gives every new object its own starting state." },
      ],
      problems: [155, 232],
      terms: ['state', 'invariant', 'mutable'],
      verbal: "\"I'll make an Account class whose constructor stores the owner and the balance. deposit and withdraw are O(1); withdraw refuses amounts larger than the balance so the account can never go negative.\"",
    },
    // ------------------------------------------------------------------------------------------
    {
      id: 'inheritance-composition',
      title: 'Inheritance, super() and composition',
      summary: 'Inheritance: a TextElement IS an Element. Composition: a Canvas HAS elements. Use super().__init__ to reuse the parent constructor.',
      what: "**Inheritance** creates a specialised class from a general one: `class TextElement(Element)` means every TextElement *is an* Element and gets its attributes and methods. The child can **add** attributes and **override** methods.\n\n- `super().__init__(...)` runs the parent's constructor, so the shared attributes (like `name`) are set in one place.\n- `isinstance(obj, Element)` is True for an Element and for any subclass of it.\n- **Overriding**: if the child defines `describe()`, that version runs for child objects — this is polymorphism: the caller writes `e.describe()` without checking the type.\n\n**Composition** means an object *has* other objects as attributes: a Canvas has a list of elements; a Library has books and members; a ParkingLot has spots. Composition is usually the right choice when the relationship is \"has a\" rather than \"is a\".",
      why: "The reported Canva question is exactly this: a generic Element, TextElement and ImageElement subclasses (inheritance), and a Canvas that holds elements (composition). Choosing the right relationship — and saying why — is what the interviewer is checking.",
      how: [
        "Find what every kind shares (name, position, size) and put it in the base class.",
        "Create a subclass for each kind and call `super().__init__(...)` first in its constructor, then set the extra attributes.",
        "Override a method only where behaviour really differs (`describe`, `area`).",
        "For containers (canvas, library, lot), store the contained objects as an attribute — do not inherit from list.",
        "Test with a mixed collection: loop over it calling the same method on each element.",
      ],
      code: py`
class Element:
    def __init__(self, name, x, y, width, height):
        self.name = name
        self.x, self.y = x, y
        self.width, self.height = width, height

    def describe(self):
        return f"{self.name} at ({self.x}, {self.y})"

class TextElement(Element):                      # TextElement IS an Element
    def __init__(self, name, x, y, width, height, text, font_size=12):
        super().__init__(name, x, y, width, height)   # parent sets the shared attributes
        self.text = text
        self.font_size = font_size

    def describe(self):                          # override
        return f"Text '{self.text}' " + super().describe()

class ImageElement(Element):
    def __init__(self, name, x, y, width, height, url):
        super().__init__(name, x, y, width, height)
        self.url = url

class Canvas:                                    # Canvas HAS elements (composition)
    def __init__(self, width, height):
        self.width, self.height = width, height
        self.elements = []

    def add(self, element):
        self.elements.append(element)

c = Canvas(800, 600)
c.add(TextElement("title", 10, 10, 200, 40, "Hello"))
c.add(ImageElement("logo", 300, 20, 100, 100, "https://example.com/logo.png"))
assert [e.describe() for e in c.elements] == ["Text 'Hello' title at (10, 10)", "logo at (300, 20)"]
assert all(isinstance(e, Element) for e in c.elements)
assert not isinstance(c, list) and isinstance(c.elements, list)
assert c.elements[0].font_size == 12             # default from the subclass constructor
`,
      codeNotes: [
        "`class TextElement(Element)` declares Element as the parent class.",
        "`super().__init__(...)` calls Element's constructor on the same object; inside `describe`, `super().describe()` calls the parent's version.",
        "`all(isinstance(e, Element) for e in ...)` checks that every item is an Element or a subclass.",
      ],
      complexity: {
        time: 'Constructors and describe O(1); Canvas.add O(1) amortized (list append)',
        space: 'O(k) for a canvas with k elements',
        derivation: [
          "Each constructor sets a fixed number of attributes → O(1).",
          "`list.append` is amortized O(1). Any method that searches the list (for a name) is O(k) — the next lesson fixes that with a dict.",
        ],
      },
      whenToUse: [
        "Inheritance: several kinds of the same thing that share attributes but differ in a few (text vs. image elements, car vs. motorcycle).",
        "Composition: an object that manages a collection or is built from parts (canvas, library, parking lot, queue built from two stacks).",
      ],
      mistakes: [
        "Forgetting `super().__init__(...)`, so the child object has no `name`.",
        "Repeating the shared attributes in every subclass instead of in the base class.",
        "Inheriting from a container (`class Canvas(list)`) when the canvas only *has* a list.",
        "Checking `type(e) == TextElement` everywhere instead of overriding a method.",
      ],
      checks: [
        { q: "A Canvas holds a list of elements. That relationship is…", options: ['Inheritance', 'Composition', 'Polymorphism', 'Encapsulation only'], answer: 1, explain: "The canvas HAS elements; it is not a kind of element or a kind of list." },
        { q: "What happens if TextElement.__init__ never calls super().__init__(...)?", options: ['Nothing changes', 'The shared attributes (name, x, y, …) are never set on the object', 'Python calls it automatically', 'The class cannot be created'], answer: 1, explain: "Defining __init__ in the child replaces the parent's; you must call it explicitly." },
        { q: "`isinstance(ImageElement(...), Element)` returns…", options: ['False', 'True', 'An error', 'Only True if describe is overridden'], answer: 1, explain: "isinstance is True for the class and all of its subclasses." },
      ],
      problems: [232, 155],
      terms: ['state', 'invariant'],
      verbal: "\"Element holds what every element shares — a unique name, a position and a size. TextElement and ImageElement inherit from it and add text or a URL. Canvas isn't an element; it has a collection of them, so that's composition.\"",
    },
    // ------------------------------------------------------------------------------------------
    {
      id: 'references-collections',
      title: 'Object references, collections of objects and validation',
      summary: 'Variables hold references, so two names can point at one object. Keep objects in a dict keyed by their unique field, and validate before you change state.',
      what: "**References.** A variable holds a *reference* to an object, not the object itself. `b = a` makes both names point to the same object, so changing `b.x` changes `a.x`. `a is b` tests \"same object\"; `a == b` tests \"equal value\" (which, for your own classes, is identity unless you define `__eq__`).\n\n**Collections of objects.** Choose the container from the operations you need:\n\n- A **list** keeps insertion order; finding by name is O(k).\n- A **dict keyed by the unique field** (`self.elements[name] = element`) gives O(1) lookup, O(1) duplicate checks and O(1) removal — and still iterates in insertion order in Python 3.7+.\n\n**Validation.** Check inputs *before* changing state, so a rejected call leaves the object unchanged. Pick one style and say it out loud: return `False`, raise `ValueError`, or print a message (the reported Canva question asks for a printed message). Use guard clauses: `if bad: report and return`.",
      why: "The Canva question requires rejecting duplicates and out-of-bounds elements, and cloning by name — all of which depend on lookup by a unique key and on understanding references. Most bugs in OOP interviews are aliasing bugs or validation that happens after the state was already changed.",
      how: [
        "Identify the unique field (name, account id, ISBN, plate number) — it becomes the dict key.",
        "For each mutating method, list what can be invalid (duplicate key, out of range, negative amount, missing item).",
        "Write guard clauses at the top of the method: check, report, return — before touching any state.",
        "Only after every check passes, change the state and return a success value.",
        "When you hand out objects, remember the caller receives a reference: changing it changes the stored object.",
      ],
      code: py`
class Contact:
    def __init__(self, name, phone):
        self.name, self.phone = name, phone

class PhoneBook:
    def __init__(self):
        self._by_name = {}                     # unique name -> Contact (O(1) lookup)

    def add(self, name, phone):
        if not name or not phone.isdigit():    # validate first...
            print(f"Rejected {name!r}: invalid input")
            return False
        if name in self._by_name:              # ...including uniqueness
            print(f"Rejected {name!r}: already exists")
            return False
        self._by_name[name] = Contact(name, phone)   # ...then change state
        return True

    def get(self, name):
        return self._by_name.get(name)         # None if missing (no KeyError)

    def remove(self, name):
        return self._by_name.pop(name, None) is not None

    def names(self):
        return list(self._by_name)             # insertion order

book = PhoneBook()
assert book.add("Ana", "4075550100") is True
assert book.add("Ana", "4075550199") is False          # duplicate rejected, original kept
assert book.get("Ana").phone == "4075550100"
assert book.add("Ben", "not-a-number") is False and book.names() == ["Ana"]

# References: get() returns the SAME object that is stored.
c = book.get("Ana")
c.phone = "4075550111"
assert book.get("Ana").phone == "4075550111"           # the stored contact changed too
assert book.get("Ana") is c

alias = c
assert alias is c and alias == c                       # same object
other = Contact("Ana", "4075550111")
assert other is not c and other != c                   # equal fields, different object (no __eq__)

assert book.remove("Ana") is True and book.remove("Ana") is False and book.get("Ana") is None
`,
      codeNotes: [
        "`self._by_name.get(name)` returns None for a missing key instead of raising KeyError.",
        "`pop(name, None)` removes and returns the value, or None if the key is absent.",
        "Without `__eq__`, `==` on your own objects compares identity, which is why `other != c` even though the fields match.",
      ],
      complexity: {
        time: 'add, get, remove O(1) average; names O(k)',
        space: 'O(k) for k contacts',
        derivation: [
          "Each method does a constant number of dict operations, which are O(1) on average.",
          "With a list instead of a dict, duplicate checks and lookups would scan all k contacts → O(k) per call, O(k²) to add k contacts.",
        ],
      },
      whenToUse: [
        "Any \"unique\" requirement: unique names, IDs, plates, ISBNs → dict keyed by that field.",
        "Any requirement that says \"reject\" or \"print an appropriate message\" → guard clauses before state changes.",
        "Whenever a method returns an object from a collection — decide whether the caller should get the original or a copy.",
      ],
      mistakes: [
        "Validating after appending, so the bad item is already stored.",
        "Searching a list for duplicates on every add (O(k) each) when a dict or set would be O(1).",
        "Assuming `b = a` makes a copy.",
        "Using a mutable default argument (`def __init__(self, items=[])`) — every object shares the same list. Use `None` and create the list inside.",
      ],
      checks: [
        { q: "After `c = book.get(\"Ana\")` and `c.phone = \"1\"`, what does `book.get(\"Ana\").phone` return?", options: ['The old number', '"1" — c refers to the stored object', 'None', 'An error'], answer: 1, explain: "get returns a reference to the stored Contact, not a copy." },
        { q: "Why store canvas elements in a dict keyed by name?", options: ['Dicts use less memory', 'O(1) duplicate checks and lookup by name, while keeping insertion order', 'Lists cannot hold objects', 'Names must be integers'], answer: 1, explain: "Uniqueness and clone-by-name are both lookups by name." },
        { q: "Where should validation happen in an `add` method?", options: ['After storing the item', 'At the top, before any state changes', 'In __repr__', 'Only in the caller'], answer: 1, explain: "Guard clauses first means a rejected call leaves the object unchanged." },
      ],
      problems: [1, 217],
      terms: ['reference', 'mutable', 'key-value-pair', 'hashing'],
      verbal: "\"Names must be unique, so I'll store elements in a dictionary keyed by name — O(1) to check duplicates and to look one up for cloning. add validates first and prints a message on rejection, so the canvas never ends up in an invalid state.\"",
    },
    // ------------------------------------------------------------------------------------------
    {
      id: 'copying',
      title: 'Cloning and copying objects',
      summary: 'Assignment shares; copy.copy duplicates the outer object; copy.deepcopy duplicates everything inside it. A clone usually needs a new unique name.',
      what: "Three different operations are often all called \"copy\":\n\n- **Assignment** `b = a` — no copy at all; two names, one object.\n- **Shallow copy** `copy.copy(a)` — a new outer object whose attributes still refer to the *same* inner objects. Fine when the attributes are immutable (numbers, strings, tuples).\n- **Deep copy** `copy.deepcopy(a)` — recursively copies everything reachable, so mutable attributes (lists, dicts, nested objects) are independent.\n\nA **clone method** is a deliberate copy with rules from the requirements: the reported Canva question asks to \"clone an element by specifying its name\". The source does not say how the clone is named or positioned, so you must ask — and if you cannot, state an assumption (for example: same properties, new unique name such as `\"title_copy\"`, optional offset, added to the same canvas).",
      why: "Cloning is a reported requirement, and the bug it invites is subtle: a shallow copy of an element with a mutable attribute (a list of styles, a dict of properties) makes the clone and the original share that attribute. Explaining the difference shows real understanding of references.",
      how: [
        "Ask what a clone must share and what must be independent. Default to independent (deep copy) for editable properties.",
        "Ask how the clone is identified — names must stay unique, so a clone needs a new name.",
        "Look up the original by name; report and stop if it does not exist.",
        "Create the copy (`copy.deepcopy`), then change the fields that must differ (name, maybe position).",
        "Validate the clone like any new element (unique name, inside bounds) before adding it.",
      ],
      code: py`
import copy

class Element:
    def __init__(self, name, x, y, styles=None):
        self.name, self.x, self.y = name, x, y
        self.styles = styles if styles is not None else []   # avoid a shared default list

original = Element("title", 10, 10, ["bold"])

alias = original                       # assignment: same object
shallow = copy.copy(original)          # new object, SAME styles list
deep = copy.deepcopy(original)         # new object, NEW styles list

assert alias is original
assert shallow is not original and shallow.styles is original.styles
assert deep is not original and deep.styles is not original.styles

shallow.styles.append("italic")        # also changes original.styles!
assert original.styles == ["bold", "italic"]
assert deep.styles == ["bold"]         # unaffected

shallow.x = 99                         # rebinding an attribute only affects that object
assert original.x == 10

def clone(elements, name, offset=10):
    """Clone by name into a dict of elements. Assumption: new name '<name>_copy', shifted by offset."""
    if name not in elements:
        print(f"No element named {name!r}")
        return None
    new = copy.deepcopy(elements[name])
    new.name = name + "_copy"
    while new.name in elements:        # keep names unique: title_copy, title_copy_copy, ...
        new.name += "_copy"
    new.x += offset
    new.y += offset
    elements[new.name] = new
    return new

items = {"title": Element("title", 0, 0, ["bold"])}
c1 = clone(items, "title")
c2 = clone(items, "title")
assert (c1.name, c2.name) == ("title_copy", "title_copy_copy")
assert (c1.x, c1.y) == (10, 10)
c1.styles.append("red")
assert items["title"].styles == ["bold"]          # deep copy: independent
assert clone(items, "missing") is None
`,
      codeNotes: [
        "`copy.copy(obj)` creates a new object and copies attribute references; `copy.deepcopy(obj)` also copies the objects those attributes point to.",
        "`styles if styles is not None else []` is the safe way to default a mutable attribute.",
        "`shallow.x = 99` rebinds the attribute on one object, while `shallow.styles.append(...)` mutates the shared list — that is the difference that matters.",
      ],
      complexity: {
        time: 'Assignment O(1); shallow copy O(a) attributes; deep copy O(size of everything reachable)',
        space: 'Same as time for the copies made',
        derivation: [
          "A shallow copy copies one reference per attribute → proportional to the number of attributes.",
          "A deep copy visits every object reachable from the original once (it remembers visited objects, so cycles are safe) → proportional to their total size.",
          "clone also does an O(1) average dict lookup; the unique-name loop runs once per existing copy.",
        ],
      },
      whenToUse: [
        "\"Clone\", \"duplicate\" or \"copy\" requirements in OOP questions.",
        "Returning internal state to a caller who must not be able to modify it.",
        "Copy List with Random Pointer (LC 138): a deep copy of linked objects built by hand with an old → new map.",
      ],
      mistakes: [
        "Using `b = a` and calling it a copy.",
        "Using a shallow copy when the object holds lists or dicts that the clone will edit.",
        "Giving the clone the same unique name as the original.",
        "Not stating the cloning assumptions when the requirements are silent.",
      ],
      checks: [
        { q: "`s = copy.copy(e)` and then `s.styles.append(\"red\")`. What happens to `e.styles`?", options: ['Unchanged', 'It also gets "red" — both share one list', 'It is deleted', 'Python raises an error'], answer: 1, explain: "A shallow copy shares the inner list." },
        { q: "The Canva requirements say \"clone an element by specifying its name\" but nothing else. What is the best move?", options: ['Pick any behavior silently', 'Ask, or state assumptions (new unique name, offset position, deep copy) before coding', 'Refuse until told more', 'Return the same object'], answer: 1, explain: "Clarifying or stating assumptions is exactly what interviewers look for when a spec is incomplete." },
        { q: "Which situation is fine with a shallow copy?", options: ['An object whose attributes are only ints and strings', 'An object holding a list of child elements', 'A linked list with random pointers', 'A dict of lists'], answer: 0, explain: "Immutable attributes cannot be changed through the shared reference, so sharing them is harmless." },
      ],
      problems: [138],
      terms: ['shallow-copy', 'deep-copy', 'reference', 'mutable'],
      verbal: "\"For clone I'll look the element up by name, deepcopy it so editing the clone never changes the original, give it a new unique name, offset it slightly, and validate it like any other add. I'm assuming that naming rule — I'd confirm it with you.\"",
    },
  ],
};
