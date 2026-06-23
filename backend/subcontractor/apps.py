from django.apps import AppConfig


class SubcontractorConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'subcontractor'
    verbose_name = 'Subcontractor Contract Management'

    def ready(self):
        import subcontractor.signals  # noqa: F401