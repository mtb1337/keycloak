import React, { useState } from "react";
import { Link, useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  AlertVariant,
  Button,
  ButtonVariant,
  PageSection,
} from "@patternfly/react-core";
import { IFormatter, IFormatterValueType } from "@patternfly/react-table";

import { useAdminClient } from "../context/auth/AdminClient";
import { ViewHeader } from "../components/view-header/ViewHeader";
import RoleRepresentation from "keycloak-admin/lib/defs/roleRepresentation";
import { ListEmptyState } from "../components/list-empty-state/ListEmptyState";
import { KeycloakDataTable } from "../components/table-toolbar/DataList";
import { ExternalLink } from "../components/external-link/ExternalLink";
import { useAlerts } from "../components/alert/Alerts";
import { useConfirmDialog } from "../components/confirm-dialog/ConfirmDialog";

export const RealmRolesSection = () => {
  const { t } = useTranslation("roles");
  const history = useHistory();
  const adminClient = useAdminClient();
  const { addAlert } = useAlerts();

  const [selectedRole, setSelectedRole] = useState<RoleRepresentation>();

  const loader = async (first?: number, max?: number, search?: string) => {
    const params: { [name: string]: string | number } = {
      first: first!,
      max: max!,
      search: search!,
    };
    return await adminClient.roles.find(params);
  };

  const RoleDetailLink = (role: RoleRepresentation) => (
    <>
      <Link key={role.id} to={`/roles/${role.id}`}>
        {role.name}
      </Link>
    </>
  );

  const emptyFormatter = (): IFormatter => (data?: IFormatterValueType) => {
    return data ? data : "—";
  };

  const externalLink = (): IFormatter => (data?: IFormatterValueType) => {
    return (data ? (
      <ExternalLink href={"roles/" + data.toString()} />
    ) : undefined) as object;
  };

  const boolFormatter = (): IFormatter => (data?: IFormatterValueType) => {
    const boolVal = data?.toString();

    return (boolVal
      ? boolVal.charAt(0).toUpperCase() + boolVal.slice(1)
      : undefined) as string;
  };

  const [toggleDeleteDialog, DeleteConfirm] = useConfirmDialog({
    titleKey: "roles:roleDeleteConfirm",
    messageKey: t("roles:roleDeleteConfirmDialog", {
      selectedRoleName: selectedRole ? selectedRole!.name : "",
    }),
    continueButtonLabel: "common:delete",
    continueButtonVariant: ButtonVariant.danger,
    onConfirm: async () => {
      try {
        await adminClient.roles.delById({
          id: selectedRole!.id!,
        });
        setSelectedRole(undefined);
        addAlert(t("roleDeletedSuccess"), AlertVariant.success);
      } catch (error) {
        addAlert(`${t("roleDeleteError")} ${error}`, AlertVariant.danger);
      }
    },
  });

  const goToCreate = () => history.push("/roles/add-role");
  return (
    <>
      <ViewHeader titleKey="roles:title" subKey="roles:roleExplain" />
      <PageSection variant="light">
        <DeleteConfirm />
        <KeycloakDataTable
          key={selectedRole ? selectedRole.id : "roleList"}
          loader={loader}
          ariaLabelKey="roles:roleList"
          searchPlaceholderKey="roles:searchFor"
          isPaginated
          toolbarItem={
            <>
              <Button onClick={goToCreate}>{t("createRole")}</Button>
            </>
          }
          actions={[
            {
              title: t("common:Delete"),
              onRowClick: (role) => {
                setSelectedRole(role);
                toggleDeleteDialog();
              },
            },
          ]}
          columns={[
            {
              name: "name",
              displayKey: "roles:roleName",
              cellRenderer: RoleDetailLink,
              cellFormatters: [externalLink(), emptyFormatter()],
            },
            {
              name: "composite",
              displayKey: "roles:composite",
              cellFormatters: [boolFormatter(), emptyFormatter()],
            },
            {
              name: "description",
              displayKey: "roles:description",
              cellFormatters: [emptyFormatter()],
            },
          ]}
          emptyState={
            <ListEmptyState
              hasIcon={true}
              message={t("noRolesInThisRealm")}
              instructions={t("noRolesInThisRealmInstructions")}
              primaryActionText={t("createRole")}
              onPrimaryAction={goToCreate}
            />
          }
        />
      </PageSection>
    </>
  );
};
