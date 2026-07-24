import logging
import re


SENSITIVE_RE = re.compile(
    r"(password|token|authorization|cookie|secret|api[_-]?key)(\s*[:=]\s*)(['\"]?)[^'\"\s&,}]+",
    re.IGNORECASE,
)


class SensitiveDataFilter(logging.Filter):
    def filter(self, record):
        if isinstance(record.msg, str):
            record.msg = SENSITIVE_RE.sub(r"\1\2\3***", record.msg)
        if record.args:
            record.args = tuple(
                SENSITIVE_RE.sub(r"\1\2\3***", str(arg))
                for arg in record.args
            )
        return True
