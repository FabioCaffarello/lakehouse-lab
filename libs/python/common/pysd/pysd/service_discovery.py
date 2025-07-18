import os


class ServiceUnavailableError(Exception):
    pass


class UnrecoverableError(Exception):
    pass


class WrongIpEndpoint(Exception):
    pass


class WrongPortEndpoint(Exception):
    pass


class ServiceDiscovery:

    def __init__(self, envvars):
        if envvars is None:
            raise UnrecoverableError("envvars cant be None")
        self._vars = envvars

    def _create_var_with_endpoint_ip_and_port_var(
        self, ip_varname, port_varname, new_var_name
    ):
        ip_addr = self._vars[ip_varname]
        if ":" in ip_addr or "/" in ip_addr:
            raise WrongIpEndpoint("Incorrect ip endpoint")
        port_addr = self._vars[port_varname]
        if not port_addr.isnumeric():
            raise WrongPortEndpoint("Incorrect port endpoint")
        self._vars[new_var_name] = f"tcp://{ip_addr}:{port_addr}"

    def _get_endpoint(self, varname, protocol="http"):
        if varname not in self._vars:
            raise ServiceUnavailableError(
                "Unable to find env variable: {}".format(varname)
            )
        tcp_addr = self._vars[varname]
        return tcp_addr.replace("tcp", protocol)

    def rabbitmq_endpoint(self):
        # WHY: RabbitMQ changed the default exposed port on its docker images
        # This is compatible with the dev env and with k8s exported vars
        # But it is not awesome, we should migrate to full DNS soon
        return self._get_endpoint("RABBITMQ_PORT_5672_TCP", "amqp")

    def phog_transparent_endpoint(self):
        return _get_endpoint_auth(self._get_endpoint, "PHOG_PORT_8081_TCP")

    def phog_endpoint(self):
        return _get_endpoint_auth(self._get_endpoint, "PHOG_PORT_80_TCP")

    def mongo_endpoint(self):
        return self._get_endpoint("MONGO_PORT").replace("http://", "mongodb://")


def new_from_env():
    return ServiceDiscovery(os.environ)


def get_gateway_host():
    gk_host = os.environ.get("GATEWAY_HOST")
    if gk_host:
        return gk_host
    raise EnvironmentError("you must configure GATEWAY_HOST environment variable")


def _has_auth():
    client_id = os.environ.get("CLIENT_ID")
    client_secret = os.environ.get("CLIENT_SECRET")
    if client_id and client_secret:
        return True
    return False


def _get_endpoint_auth(service_endpoint, *args):
    if _has_auth():
        return get_gateway_host()
    return service_endpoint(*args)
