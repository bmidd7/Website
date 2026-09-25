from django.contrib import admin

from .models import BookAutograph, BookContact, BookCopy, BookReading, Books, BookTransfer


class BookCopyInline(admin.TabularInline):
    model = BookCopy
    extra = 0
    fields = (
        "inventory_number",
        "current_holder",
        "collection_status",
        "current_location",
        "condition",
    )
    show_change_link = True


class BookAutographInline(admin.TabularInline):
    model = BookAutograph
    extra = 0


@admin.register(Books)
class BooksAdmin(admin.ModelAdmin):
    list_display = ("title", "authors", "edition", "binding", "publisher", "publication_date")
    list_filter = ("binding", "language", "is_illustrated")
    search_fields = ("title", "subtitle", "authors", "isbn_10", "isbn_13", "series_name")
    inlines = [BookCopyInline]


@admin.register(BookContact)
class BookContactAdmin(admin.ModelAdmin):
    list_display = ("name", "relationship", "user", "email")
    list_filter = ("relationship",)
    search_fields = ("name", "email")


@admin.register(BookCopy)
class BookCopyAdmin(admin.ModelAdmin):
    list_display = (
        "book",
        "inventory_number",
        "current_holder",
        "collection_status",
        "current_location",
        "condition",
    )
    list_filter = ("collection_status", "condition", "acquisition_method", "has_dust_jacket", "is_signed")
    search_fields = ("book__title", "inventory_number", "barcode", "current_holder__name")
    list_select_related = ("book", "current_holder")
    inlines = [BookAutographInline]


@admin.register(BookAutograph)
class BookAutographAdmin(admin.ModelAdmin):
    list_display = ("signer", "signer_role", "copy", "signed_on", "is_authenticated")
    list_filter = ("signer_role", "is_authenticated", "is_inscribed")
    search_fields = ("signer", "copy__book__title", "inscription", "personalized_to")
    list_select_related = ("copy__book",)


@admin.register(BookTransfer)
class BookTransferAdmin(admin.ModelAdmin):
    list_display = ("copy", "transfer_type", "from_person", "to_person", "transferred_on")
    list_filter = ("transfer_type",)
    search_fields = ("copy__book__title", "from_person__name", "to_person__name")
    list_select_related = ("copy__book", "from_person", "to_person")


@admin.register(BookReading)
class BookReadingAdmin(admin.ModelAdmin):
    list_display = ("reader", "book", "status", "rating", "finished_on")
    list_filter = ("status", "rating")
    search_fields = ("reader__name", "book__title")
    list_select_related = ("reader", "book")
