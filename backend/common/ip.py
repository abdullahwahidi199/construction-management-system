from ipaddress import ip_address, ip_network

from django.conf import settings


def _trusted_proxy_networks():
    networks = []
    for value in getattr(settings, "TRUSTED_PROXY_IPS", []):
        try:
            networks.append(ip_network(value, strict=False))
        except ValueError:
            continue
    return networks


def _is_trusted_proxy(value):
    try:
        candidate = ip_address(value)
    except (TypeError, ValueError):
        return False
    return any(candidate in network for network in _trusted_proxy_networks())


def _valid_ip(value):
    try:
        return str(ip_address(value))
    except (TypeError, ValueError):
        return ""


def get_client_ip(request):
    """
    Resolve the client IP without trusting spoofable forwarding headers from
    direct clients. X-Forwarded-For is used only when the immediate peer is a
    configured trusted reverse proxy.
    """
    remote_addr = _valid_ip(request.META.get("REMOTE_ADDR"))
    forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR", "")

    if remote_addr and forwarded_for and _is_trusted_proxy(remote_addr):
        chain = [_valid_ip(item.strip()) for item in forwarded_for.split(",")]
        chain = [item for item in chain if item]
        for candidate in reversed(chain):
            if not _is_trusted_proxy(candidate):
                return candidate

    return remote_addr or "0.0.0.0"

